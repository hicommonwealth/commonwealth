import Sequelize from 'sequelize';
import {
  SubstrateTypes, MolochTypes,
  SubstrateEvents, MolochEvents, IEventLabel, IEventTitle, IChainEventData } from '@commonwealth/chain-events';
import { SENDGRID_API_KEY, SERVER_URL } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import { getProposalUrl } from '../../shared/utils';
import {
  IPostNotificationData, NotificationCategories,
  DynamicTemplate, IChainEventNotificationData
} from '../../shared/types';

const { Op } = Sequelize;
const log = factory.getLogger(formatFilename(__filename));

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

// called when a immediate notification is emitted, to construct an email
// object that can be sent directly (by sendImmediateNotificationEmail)
export const createNotificationEmailObject = (
  notification_data: IPostNotificationData | IChainEventNotificationData, category_id, chain_name?
) => {
  let label: IEventLabel;
  const chainId = (notification_data as IChainEventNotificationData).chainEventType?.chain;
  if ((notification_data as IChainEventNotificationData).chainEvent !== undefined) {
    const { blockNumber } = (notification_data as IChainEventNotificationData).chainEvent;
    if (SubstrateTypes.EventChains.includes(chainId)) {
      if (chainId === 'polkadot') return;
      label = SubstrateEvents.Label(
        blockNumber,
        chainId,
        (notification_data as IChainEventNotificationData).chainEvent.event_data as IChainEventData
      );
    // } else if (MolochTypes.EventChains.includes(chainId)) {
    //   label = MolochEvents.Label(
    //     blockNumber,
    //     chainId,
    //     (notification_data as IChainEventNotificationData).chainEvent.event_data,
    //   );
    }
  }

  const { created_at, root_id, root_title, root_type, comment_id, comment_text,
    chain_id, community_id, author_address, author_chain } = (notification_data as IPostNotificationData);
  const decodedTitle = decodeURIComponent(root_title).trim();
  const subjectLine = (label?.heading)
    || ((category_id === NotificationCategories.NewComment) ? `New comment on '${decodedTitle}'`
      : (category_id === NotificationCategories.NewMention) ? `New mention on '${decodedTitle}'`
        : (category_id === NotificationCategories.NewReaction) ? `New reaction on '${decodedTitle}'`
          : (category_id === NotificationCategories.NewThread) ? `New thread called '${decodedTitle}'`
            : (category_id === NotificationCategories.ThreadEdit) ? `'${decodedTitle}' edited`
              : 'New notification');

  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
    community: community_id,
  };
  const args = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
  const path = label?.linkUrl ? `${SERVER_URL}${label.linkUrl}`
    : label ? `${SERVER_URL}/${chainId}`
      : (getProposalUrl as any)(...args);
  const msg = {
    to: 'zak@commonwealth.im',
    from: 'Commonwealth <no-reply@commonwealth.im>',
    subject: subjectLine,
    templateId: DynamicTemplate.ImmediateEmailNotification, // 'd-3f30558a95664528a2427b40292fec51',
    dynamic_template_data: {
      notification: {
        subject: subjectLine,
        title: label?.heading || subjectLine,
        body: label?.label || subjectLine,
        path,
      }
    },
  };
  return msg;
};

// called when an email digest is generated, to construct an email object that
// can be sent directly (by sendNotificationEmailDigestForUser)
const createBatchedNotificationEmailObject = async (user, notifications) => {
  let emailObjArray = [];
  emailObjArray = await Promise.all(notifications.map(async (n) => {
    const { created_at, root_id, root_title, root_type, comment_id, comment_text,
      chain_id, community_id, author_address, author_chain } = JSON.parse(n.notification_data);
    const decodedTitle = decodeURIComponent(root_title).trim();
    const nSubscription = await n.getSubscription();
    const { category_id } = nSubscription;
    const content = (category_id === NotificationCategories.NewComment) ? `New comment on '${decodedTitle}'`
      : (category_id === NotificationCategories.NewMention) ? `New mention on '${decodedTitle}'`
        : (category_id === NotificationCategories.NewReaction) ? `New reaction on '${decodedTitle}'`
          : (category_id === NotificationCategories.NewThread) ? `New Thread in '${decodedTitle}'`
            : (category_id === NotificationCategories.ThreadEdit) ? `'${decodedTitle}' edited`
              : 'New notification on Commonwealth';
    const pseudoProposal = {
      id: root_id,
      title: root_title,
      chain: chain_id,
      community: community_id,
    };
    const args = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
    const path = (getProposalUrl as any)(...args);
    return { path, content, decodedTitle, category_id, subscription: nSubscription };
  }));

  const subject = `${notifications.length} unread notifications on Commonwealth!`;
  const msg = {
    to: 'zak@commonwealth.im', // TODO user.email
    from: 'Commonwealth <no-reply@commonwealth.im>',
    templateId: DynamicTemplate.BatchNotifications,
    dynamic_template_data: {
      notifications: emailObjArray,
      subject,
      user: user.email,
    },
  };
  await sgMail.send(msg);
  return msg;
};

export const sendImmediateNotificationEmail = async (subscription, emailObject) => {
  const user = await subscription.getUser();
  if (!emailObject) return;
  emailObject.to = (process.env.NODE_ENV === 'development') ? 'zak@commonwealth.im' : user.email;

  try {
    await sgMail.send(emailObject);
  } catch (e) {
    log.error(e);
  }
};

export const sendNotificationEmailDigestForUser = async (models, user) => {
  const subscriptions = await models.Subscription.findAll({
    where: {
      subscriber_id: user.id,
    },
  });
  const subscriptionIds = subscriptions.map((s) => s.id);
  const notifications = await models.Notification.findAll({
    where: {
      subscription_id: {
        [Op.in]: subscriptionIds,
      },
      is_read: false,
    }
  });
  const msg = await createBatchedNotificationEmailObject(user, notifications);
  return msg;
};

export const sendNotificationEmailDigest = async (models, interval: string) => {
  log.info(`Sending ${interval} emails now`);
  const users = await models.User.findAll({
    where: {
      emailNotificationInterval: interval,
    }
  });
  log.info(`users: ${users.length}`);
  await Promise.all(users.map(async (user) => {
    await sendNotificationEmailDigestForUser(models, user).then((msg) => { return msg; });
  }));
};
