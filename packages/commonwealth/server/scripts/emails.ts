import type {
  CWEvent,
  IChainEventData,
  SupportedNetwork,
} from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';

import { factory, formatFilename } from 'common-common/src/logging';
import { NotificationCategories } from 'common-common/src/types';
import { capitalize } from 'lodash';
import { Op, Sequelize } from 'sequelize';
import type { DB } from '../models';
import { getForumNotificationCopy } from '../../shared/notificationFormatter';
import type { IPostNotificationData } from '../../shared/types';
import { DynamicTemplate } from '../../shared/types';
import { SENDGRID_API_KEY } from '../config';
import type { UserAttributes } from '../models/user';
import { formatAddressShort } from '../../shared/utils';
import moment from 'moment';

const log = factory.getLogger(formatFilename(__filename));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

export const createImmediateNotificationEmailObject = async (
  notification_data,
  category_id,
  models
) => {
  if (notification_data.chainEvent && notification_data.chainEventType) {
    // construct compatible CW event from DB by inserting network from type
    const evt: CWEvent = {
      blockNumber: notification_data.chainEvent.block_number,
      data: notification_data.chainEvent.event_data as IChainEventData,
      network: notification_data.chainEventType
        .event_network as SupportedNetwork,
    };

    try {
      const chainEventLabel = ChainEventLabel(
        notification_data.chainEventType.chain,
        evt
      );
      if (!chainEventLabel) return;

      const subject = `${
        process.env.NODE_ENV !== 'production' ? '[dev] ' : ''
      }${chainEventLabel.heading} event on ${capitalize(
        notification_data.chainEventType.chain
      )}`;

      return {
        from: 'Commonwealth <no-reply@commonwealth.im>',
        to: null,
        bcc: null,
        subject,
        templateId: DynamicTemplate.ImmediateEmailNotification,
        dynamic_template_data: {
          notification: {
            chainId: notification_data.chainEventType.chain,
            blockNumber: notification_data.chainEvent.blockNumber,
            subject,
            label: subject,
            path: null,
          },
        },
      };
    } catch (err) {
      console.error(`Failed to label chain event: ${err.message}`);
    }
  } else if (
    category_id !== NotificationCategories.NewReaction &&
    category_id !== NotificationCategories.ThreadEdit
  ) {
    const [
      emailSubjectLine,
      subjectCopy,
      actionCopy,
      objectCopy,
      communityCopy,
      excerpt,
      proposalPath,
      authorPath,
    ] = await getForumNotificationCopy(
      models,
      notification_data as IPostNotificationData,
      category_id
    );
    return {
      from: 'Commonwealth <no-reply@commonwealth.im>',
      to: null,
      bcc: null,
      subject:
        (process.env.NODE_ENV !== 'production' ? '[dev] ' : '') +
        emailSubjectLine,
      templateId: DynamicTemplate.ImmediateEmailNotification,
      dynamic_template_data: {
        notification: {
          subject: emailSubjectLine,
          author: subjectCopy,
          action: actionCopy,
          rootObject: objectCopy,
          community: communityCopy,
          excerpt,
          proposalPath,
          authorPath,
        },
      },
    };
  }
};

export const sendImmediateNotificationEmail = async (
  user: UserAttributes,
  emailObject
) => {
  if (!emailObject) {
    console.log('attempted to send empty immediate notification email');
    return;
  }
  emailObject.to =
    process.env.NODE_ENV === 'development'
      ? 'raymond@commonwealth.im'
      : user.email;
  emailObject.bcc = 'raymond+bcc@commonwealth.im';

  try {
    console.log(`sending immediate notification email to ${emailObject.to}`);
    await sgMail.send(emailObject);
  } catch (e) {
    log.error(
      'Failed to send immediate notification email',
      e?.response?.body?.errors
    );
  }
};

export const sendBatchedNotificationEmails = async (
  models
): Promise<number> => {
  log.info('Sending daily notification emails');

  try {
    const users = await models.User.scope('withPrivateData').findAll({
      where: { emailNotificationInterval: 'daily' },
    });

    log.info(`Sending to ${users.length} users`);

    const last24hours = new Date((new Date() as any) - 24 * 60 * 60 * 1000);
    await Promise.all(
      users.map(async (user) => {
        const notifications = await models.Notification.findAll({
          include: [
            {
              model: models.Subscription,
              where: { subscriber_id: user.id },
            },
          ],
          where: {
            // is_read: false,
            created_at: { [Op.gt]: last24hours },
          },
          order: [['created_at', 'DESC']],
        });
        if (notifications.length === 0) {
          console.log(`empty digest for ${user.email}`);
          return; // don't notify if no new notifications in the last 24h
        }

        // send notification email
        try {
          console.log(`producing digest for ${user.email}`);
          // const emailObject = await createNotificationDigestEmailObject(user, notifications, models);
          // emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
          // emailObject.bcc = 'raymond+bcc@commonwealth.im';

          // console.log(`sending batch notification email to ${user.email}`);
          // await sgMail.send(emailObject);
        } catch (e) {
          console.log('Failed to send batch notification email', e);
        }
      })
    );
    return 0;
  } catch (e) {
    console.log(e.message);
    return 1;
  }
};

export type ThreadData = {
  title: string;
  body: string;
  comment_count: number;
  view_count: number;
  author_address: string;
  author_address_short: string;
  author_name: string;
  author_profile_img_url: string;
  publish_date_string: string;
  thread_id: number;
};

export type CommunityDigestInfo = {
  [communityId: string]: {
    community_name: string;
    community_icon: string;
    topThreads: ThreadData[];
    activityScore: number;
  };
};

// Defines which emails should get sent
export const digestLevels = {
  '0': ['monthly'],
  '1': ['twoweeks', 'monthly'],
  '2': ['weekly', 'twoweeks', 'monthly'],
  '3': ['daily', 'weekly', 'twoweeks', 'monthly'],
};

export const getTopThreads = async (
  models: DB,
  communityId: string
): Promise<ThreadData[]> => {
  const res = await models.sequelize.query(`SELECT 
        t.title,
        SUBSTRING(t.body, 1, 300) AS body,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT r.id) AS view_count,
        a.address AS author_address,
        t.id AS thread_id
      FROM 
        "Threads" t
        LEFT JOIN "Comments" c ON t.id = CAST(substring(c.root_id from '[0-9]+$') AS INTEGER)
        LEFT JOIN "Reactions" r ON t.id = r.thread_id
        INNER JOIN "Addresses" a ON t.address_id = a.id
      WHERE 
        t.chain='${communityId}' AND c.created_at > NOW() - INTERVAL '6 MONTH' AND r.created_at > NOW() - INTERVAL '6 MONTH'
      GROUP BY 
        t.id, a.address
      ORDER BY 
        0.6 * COUNT(DISTINCT c.id) + 0.4 * COUNT(DISTINCT r.id) DESC
      LIMIT 3;`);

  const threadData: ThreadData[] = [];

  if ((res[1] as any)?.rows) {
    const rows = (res[1] as any)?.rows;
    for (const row of rows) {
      const shortAddress = formatAddressShort(
        row.author_address,
        communityId,
        false,
        4
      );

      const addressData = await models.Address.findOne({
        where: {
          address: row.author_address,
          chain: communityId,
        },
      });

      // TODO: When new profiles are created, this will need to be swapped in
      // const profile = await models.Profile.findOne({
      //   where: {
      //     id: addressData.profile_id,
      //     user_id: addressData.user_id,
      //   },
      // });

      const profile = await models.OffchainProfile.findOne({
        where: {
          address_id: addressData.id,
        },
      });

      let profileData;

      if (!profile) {
        console.log(
          'missing profile for ',
          row.author_address,
          ' in ',
          communityId
        );
      } else {
        profileData = JSON.parse(profile.data);
      }

      const data: ThreadData = {
        title: row.title,
        body: row.plaintext,
        comment_count: row.comment_count,
        view_count: row.view_count,
        author_address: row.author_address,
        author_address_short: shortAddress,
        author_name: profileData ? profileData.name : 'Anonymous',
        author_profile_img_url: profileData ? profileData.avatarUrl : '',
        thread_id: row.thread_id,
        publish_date_string: moment(row.created_at).format('MM/DD/YY'),
      };
      threadData.push(data);
    }
  }

  return threadData;
};

const getCommunityActivityScore = async (
  models: DB,
  communityId: string
): Promise<number> => {
  const activityScore = await models.sequelize.query(`SELECT 
          0.4 * COUNT(DISTINCT t.id) +
          0.3 * COUNT(DISTINCT c.id) +
          0.3 * COUNT(DISTINCT r.id) AS activity_score
        FROM 
          "Threads" t
          LEFT JOIN "Comments" c ON t.id = CAST(substring(c.root_id from '[0-9]+$') AS INTEGER)
          LEFT JOIN "Reactions" r ON t.id = r.thread_id
        WHERE 
          t.chain='${communityId}' AND
          (t.created_at > NOW() - INTERVAL '6 MONTH' OR
          c.created_at > NOW() - INTERVAL '6 MONTH' OR
          r.created_at > NOW() - INTERVAL '6 MONTH')`);

  return (activityScore[1] as any)?.rows?.[0]?.activity_score as number;
};

export const emailDigestBuilder = async (models: DB, digestLevel: number) => {
  // Go through each community on CW
  const communities = await models.Chain.findAll();

  const communityDigestInfo: CommunityDigestInfo = {};

  console.log('Starting community digest builder...');
  for (const community of communities) {
    // if community includes a ' character skip it- SQL queries break and these are fake communities
    if (community.id.includes("'")) continue;

    try {
      const topThreads = await getTopThreads(models, community.id);

      const activityScore = await getCommunityActivityScore(
        models,
        community.id
      );

      communityDigestInfo[community.id] = {
        community_name: community.name,
        community_icon: community.icon_url,
        topThreads,
        activityScore,
      };
    } catch (e) {
      console.log(e);
      console.log("couldn't get top threads for community", community.id);
    }
  }

  console.log('Finished community digest builder...');

  const intervalsArray = digestLevels[digestLevel];
  console.log('Digest level: ', intervalsArray);

  const usersWithEmailDigestOn = await models.User.findAll({
    where: {
      emailNotificationInterval: {
        [Op.in]: intervalsArray,
      },
    },
  });

  const allEmailObjects = [];

  console.log('Starting email generation...');

  for (const user of usersWithEmailDigestOn) {
    const emailObject = []; // TODO: Decide what this looks like
    const userAddresses = await models.Address.findAll({
      where: {
        user_id: user.id,
      },
    });

    const userCommunities = userAddresses.reduce((acc, address) => {
      if (address.chain && !acc.includes(address.chain)) {
        acc.push(address.chain);
      }
      return acc;
    }, [] as string[]);

    for (const chain_id of userCommunities) {
      const communityDigest = communityDigestInfo[chain_id];
      if (!communityDigest || communityDigest.topThreads.length < 1) continue;
      emailObject.push(communityDigest);
    }

    // Fire off Email?
    allEmailObjects.push(
      emailObject.sort((a, b) => b.activityScore - a.activityScore)
    );

    const msg = {
      to: user.email,
      from: 'Commonwealth <no-reply@commonwealth.im>',
      templateId: DynamicTemplate.EmailDigest,
      dynamic_template_data: emailObject.sort(
        (a, b) => b.activityScore - a.activityScore
      ),
    };
    // await sgMail.send(msg);
  }

  return allEmailObjects;
};
