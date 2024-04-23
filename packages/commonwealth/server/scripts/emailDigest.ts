import { HotShotsStats } from '@hicommonwealth/adapters/build/index';
import { stats } from '@hicommonwealth/core/build/index';
import { models } from '@hicommonwealth/model';
import { DynamicTemplate } from '@hicommonwealth/shared';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { Op } from 'sequelize';
import { formatAddressShort } from '../../shared/utils';
import { SENDGRID_API_KEY } from '../config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
dotenv.config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

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
  thread_url: string;
};

export type CommunityDigestInfo = {
  [communityId: string]: {
    community_name: string;
    community_icon: string;
    top_threads: ThreadData[];
    activity_score: number;
    new_posts: number;
    new_comments: number;
  };
};

// Defines which emails should get sent
export const digestLevels = {
  '0': ['monthly'],
  '1': ['twoweeks', 'monthly'],
  '2': ['weekly', 'twoweeks', 'monthly'],
  '3': ['daily', 'weekly', 'twoweeks', 'monthly'],
};

// TODO: CHANGE TO 1 WEEK
export const getTopThreads = async (
  communityId: string,
): Promise<ThreadData[]> => {
  const res = await models.sequelize.query(`SELECT
        t.title,
        SUBSTRING(t.plaintext, 1, 300) AS body,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT r.id) AS view_count,
        a.address AS author_address,
        t.id AS thread_id,
        t.created_at AS created_at
      FROM
        "Threads" t
        LEFT JOIN "Comments" c ON t.id = c.thread_id
        LEFT JOIN "Reactions" r ON t.id = r.thread_id
        INNER JOIN "Addresses" a ON t.address_id = a.id
      WHERE
        t.community_id='${communityId}'
        AND c.created_at > NOW() - INTERVAL '1 WEEK' AND r.created_at > NOW() - INTERVAL '1 WEEK'
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
        4,
      );

      const addressData = await models.Address.findOne({
        where: {
          address: row.author_address,
          community_id: communityId,
        },
      });

      const profile = await models.Profile.findOne({
        where: {
          id: addressData.profile_id,
          user_id: addressData.user_id,
        },
      });

      if (!profile) {
        console.log(
          'missing profile for ',
          row.author_address,
          ' in ',
          communityId,
        );
      }

      const data: ThreadData = {
        title: decodeURIComponent(row.title),
        body: row.body,
        comment_count: row.comment_count,
        view_count: row.view_count,
        author_address: row.author_address,
        author_address_short: shortAddress,
        author_name: profile ? profile.profile_name : 'Anonymous',
        author_profile_img_url: profile ? profile.avatar_url : '',
        thread_id: row.thread_id,
        publish_date_string: moment(row.created_at).format('MM/DD/YY'),
        thread_url: `https://www.commonwealth.im/${communityId}/discussion/${row.thread_id}`,
      };
      threadData.push(data);
    }
  }

  return threadData;
};

const getCommunityActivityScore = async (
  communityId: string,
): Promise<number> => {
  const activityScore = await models.sequelize.query(`SELECT
          0.4 * COUNT(DISTINCT t.id) +
          0.3 * COUNT(DISTINCT c.id) +
          0.3 * COUNT(DISTINCT r.id) AS activity_score
        FROM
          "Threads" t
          LEFT JOIN "Comments" c ON t.id = c.thread_id
          LEFT JOIN "Reactions" r ON t.id = r.thread_id
        WHERE
          t.community_id='${communityId}' AND
          (t.created_at > NOW() - INTERVAL '1 WEEK' OR
          c.created_at > NOW() - INTERVAL '1 WEEK' OR
          r.created_at > NOW() - INTERVAL '1 WEEK')`);

  return (activityScore[1] as any)?.rows?.[0]?.activity_score as number;
};

const getActivityCounts = async (communityId: string) => {
  const commentCounts = await models.sequelize.query(`SELECT
              COUNT(DISTINCT c.id) AS comment_count
              FROM "Comments" c
              WHERE
              c.community_id='${communityId}' AND
              c.created_at > NOW() - INTERVAL '1 WEEK'`);

  const totalComments = (commentCounts[1] as any)?.rows?.[0]
    ?.comment_count as number;

  const threadCounts = await models.sequelize.query(`SELECT
              COUNT(DISTINCT t.id) AS thread_count
              FROM "Threads" t
              WHERE
              t.community_id='${communityId}' AND
              t.created_at > NOW() - INTERVAL '1 WEEK'`);

  const totalThreads = (threadCounts[1] as any)?.rows?.[0]
    ?.thread_count as number;

  return { totalComments, totalThreads };
};

export const emailDigestBuilder = async (
  digestLevel: number,
  confirmationEmail: string,
) => {
  // Go through each community on CW
  const communities = await models.Community.findAll();

  const communityDigestInfo: CommunityDigestInfo = {};

  console.log('Starting community digest builder...');

  // For each community, get the top threads, activity score, and new posts/comments
  for (const community of communities) {
    // if community includes a ' character skip it- SQL queries break and these are fake communities
    if (community.id.includes("'")) continue;

    try {
      const topThreads = await getTopThreads(community.id);

      const activityScore = await getCommunityActivityScore(community.id);

      const { totalComments, totalThreads } = await getActivityCounts(
        community.id,
      );

      communityDigestInfo[community.id] = {
        community_name: community.name,
        community_icon: community.icon_url,
        top_threads: topThreads,
        activity_score: activityScore,
        new_posts: totalThreads,
        new_comments: totalComments,
      };
    } catch (e) {
      console.log(e);
      console.log("couldn't get top threads for community", community.id);
    }
  }

  console.log('Finished community digest builder...');

  const intervalsArray = digestLevels[digestLevel];
  console.log('Digest level: ', intervalsArray);

  // Find users who have email digest on
  const usersWithEmailDigestOn = await models.User.findAll({
    where: {
      emailNotificationInterval: {
        [Op.in]: intervalsArray,
      },
    },
  });

  const allEmailObjects = [];

  console.log('Starting email generation...');
  let emailsSent = 0;

  for (const user of usersWithEmailDigestOn) {
    const emailObject = [];
    const userAddresses = await models.Address.findAll({
      where: {
        user_id: user.id,
      },
    });

    const userCommunities = userAddresses.reduce((acc, address) => {
      if (address.community_id && !acc.includes(address.community_id)) {
        acc.push(address.community_id);
      }
      return acc;
    }, [] as string[]);

    for (const community_id of userCommunities) {
      const communityDigest = communityDigestInfo[community_id];
      if (!communityDigest || communityDigest.top_threads.length < 1) continue;
      emailObject.push(communityDigest);
    }

    // Build Email Object
    allEmailObjects.push({
      data: emailObject.sort((a, b) => b.activityScore - a.activityScore),
      newThreads:
        emailObject.length > 0
          ? emailObject.reduce((acc, community) => {
              acc += +community.new_posts;
              return acc;
            }, 0)
          : null,
      newComments:
        emailObject.length > 0
          ? emailObject.reduce((acc, community) => {
              acc += +community.new_comments;
              return acc;
            }, 0)
          : null,
    });

    // Build Template Data
    const dynamicData = {
      data: emailObject.sort((a, b) => b.activityScore - a.activityScore),
      newThreads:
        emailObject.length > 0
          ? emailObject.reduce((acc, community) => {
              acc += +community.new_posts;
              return acc;
            }, 0)
          : null,
      newComments:
        emailObject.length > 0
          ? emailObject.reduce((acc, community) => {
              acc += +community.new_comments;
              return acc;
            }, 0)
          : null,
    };

    const msg = {
      to: user.email,
      from: 'Commonwealth <no-reply@commonwealth.im>',
      subject: 'Common Weekly Digest',
      templateId: DynamicTemplate.EmailDigest,
      dynamic_template_data: dynamicData,
    };

    if (process.env.NODE_ENV === 'production' && dynamicData.data.length > 0) {
      try {
        if (user.email) {
          await sgMail.send(msg);
          emailsSent += 1;
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  console.log('Sent emails to ', emailsSent, ' users.');

  try {
    const msg = {
      to: confirmationEmail,
      from: 'Commonwealth <no-reply@commonwealth.im>',
      subject: 'Common Weekly Digest Completion Report',
      text: `Sent emails to ${emailsSent} users.`,
    };
    await sgMail.send(msg);
  } catch (e) {
    console.log(e);
  }

  return allEmailObjects;
};

emailDigestBuilder(3, 'alex@common.xyz')
  .then(() => {
    stats(HotShotsStats()).increment('cw.scheduler.email-digest');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
