import { logger } from '@hicommonwealth/core';
import type { UserAttributes } from '@hicommonwealth/model';
import { AddressAttributes, DB } from '@hicommonwealth/model';
import type {
  IChainEventNotificationData,
  IForumNotificationData,
  ISnapshotNotificationData,
} from '@hicommonwealth/shared';
import {
  DynamicTemplate,
  NotificationCategories,
} from '@hicommonwealth/shared';
import { capitalize } from 'lodash';
import { Op, WhereOptions } from 'sequelize';
import { Label as ChainEventLabel } from '../../shared/chain/labelers/util';
import type { CWEvent } from '../../shared/chain/types/types';
import {
  formatAddressShort,
  getThreadUrl,
  renderQuillDeltaToText,
  smartTrim,
} from '../../shared/utils';
import { SENDGRID_API_KEY } from '../config';

const log = logger().getLogger(__filename);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

const getForumNotificationCopy = async (
  models: DB,
  notification_data: IForumNotificationData,
  category_id,
) => {
  // unpack notification_data
  const {
    thread_id,
    root_title,
    comment_id,
    comment_text,
    community_id,
    author_address,
    author_community_id,
  } = notification_data;

  // title
  const decodedTitle = decodeURIComponent(root_title).trim();

  // email subject line
  const emailSubjectLine =
    category_id === NotificationCategories.NewComment
      ? `Comment on: ${decodedTitle}`
      : category_id === NotificationCategories.NewMention
      ? `You were mentioned in: ${decodedTitle}`
      : category_id === NotificationCategories.NewCollaboration
      ? `You were added as a collaborator on: ${decodedTitle}`
      : category_id === NotificationCategories.NewThread
      ? `New thread: ${decodedTitle}`
      : 'New activity on Commonwealth';

  // author
  const addressWhere: WhereOptions<AddressAttributes> = {
    address: author_address,
    community_id: author_community_id || null,
  };
  const authorProfile = await models.Profile.findOne({
    include: [
      {
        model: models.Address,
        where: addressWhere,
        required: true,
      },
    ],
  });
  let authorName;
  const author_addr_short = formatAddressShort(
    author_address,
    author_community_id,
    true,
  );
  try {
    authorName = authorProfile.profile_name || author_addr_short;
  } catch (e) {
    authorName = author_addr_short;
  }
  // author profile link
  const authorPath =
    `https://commonwealth.im/${author_community_id}` +
    `/account/${author_address}?base=${author_community_id}`;

  // action and community
  const actionCopy = [
    NotificationCategories.NewComment,
    NotificationCategories.CommentEdit,
  ].includes(category_id)
    ? 'commented on'
    : category_id === NotificationCategories.NewMention
    ? 'mentioned you in the thread'
    : category_id === NotificationCategories.NewCollaboration
    ? 'invited you to collaborate on'
    : [
        NotificationCategories.ThreadEdit,
        NotificationCategories.NewThread,
      ].includes(category_id)
    ? 'created a new thread'
    : null;
  const objectCopy = decodeURIComponent(root_title).trim();
  const communityObject = await models.Community.findOne({
    where: { id: community_id },
  });
  const communityCopy = communityObject ? `in ${communityObject.name}` : '';
  const excerpt = (() => {
    const text = decodeURIComponent(comment_text);
    try {
      // return rendered quill doc
      const doc = JSON.parse(text);
      if (!doc.ops) throw new Error();
      const finalText = renderQuillDeltaToText(doc);
      return smartTrim(finalText);
    } catch (e) {
      // return markdown
      return smartTrim(text);
    }
  })();

  // link to proposal
  const pseudoProposal = {
    id: thread_id,
    title: root_title,
    chain: community_id,
  };
  const proposalPath = getThreadUrl(pseudoProposal, comment_id);
  return [
    emailSubjectLine,
    authorName,
    actionCopy,
    objectCopy,
    communityCopy,
    excerpt,
    proposalPath,
    authorPath,
  ];
};

export const createImmediateNotificationEmailObject = async (
  notification_data:
    | IForumNotificationData
    | IChainEventNotificationData
    | ISnapshotNotificationData,
  category_id,
  models,
) => {
  if (category_id === NotificationCategories.ChainEvent) {
    const ceInstance = <IChainEventNotificationData>notification_data;
    // construct compatible CW event from DB by inserting network from type
    const evt: CWEvent = {
      blockNumber: ceInstance.block_number,
      data: ceInstance.event_data,
      network: ceInstance.network,
    };

    try {
      const chainEventLabel = ChainEventLabel(ceInstance.community_id, evt);
      if (!chainEventLabel) return;

      const subject = `${
        process.env.NODE_ENV !== 'production' ? '[dev] ' : ''
      }${chainEventLabel.heading} event on ${capitalize(
        ceInstance.community_id,
      )}`;

      return {
        from: 'Commonwealth <no-reply@commonwealth.im>',
        to: null,
        bcc: null,
        subject,
        templateId: DynamicTemplate.ImmediateEmailNotification,
        dynamic_template_data: {
          notification: {
            chainId: ceInstance.community_id,
            blockNumber: ceInstance.block_number,
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
      notification_data as IForumNotificationData,
      category_id,
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
  emailObject,
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
      e?.response?.body?.errors,
    );
  }
};

export const sendBatchedNotificationEmails = async (
  models,
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
      }),
    );
    return 0;
  } catch (e) {
    console.log(e.message);
    return 1;
  }
};
