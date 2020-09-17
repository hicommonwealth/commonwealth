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

export const createImmediateNotificationEmailObject = (
  notification_data: IPostNotificationData | IChainEventNotificationData, category_id, chain_name?
) => {
  let label: IEventLabel;
  const chainId = (notification_data as IChainEventNotificationData).chainEventType?.chain;

  // enrich chain event notifications with additional label
  if ((notification_data as IChainEventNotificationData).chainEvent !== undefined) {
    const { blockNumber } = (notification_data as IChainEventNotificationData).chainEvent;
    if (SubstrateTypes.EventChains.includes(chainId) && chainId !== 'polkadot') {
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
          : (category_id === NotificationCategories.NewThread) ? `New thread: ${decodedTitle}`
            : (category_id === NotificationCategories.ThreadEdit) ? `'${decodedTitle}' edited`
              : 'New activity on Commonwealth');

  // construct link
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
    community: community_id,
  };
  const proposalUrlArgs = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
  const path = label?.linkUrl ? `${SERVER_URL}${label.linkUrl}`
    : label ? `${SERVER_URL}/${chainId}`
      : (getProposalUrl as any)(...proposalUrlArgs);

  // construct email
  return {
    from: 'Commonwealth <no-reply@commonwealth.im>',
    to: null,
    bcc: null,
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
};

const createNotificationDigestEmailObject = async (user, notifications) => {
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
          : (category_id === NotificationCategories.NewThread) ? `New thread: ${decodedTitle}`
            : (category_id === NotificationCategories.ThreadEdit) ? `'${decodedTitle}' edited`
              : 'New activity on Commonwealth';

    // construct link
    const pseudoProposal = {
      id: root_id,
      title: root_title,
      chain: chain_id,
      community: community_id,
    };
    const args = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
    const path = (getProposalUrl as any)(...args);

    // return data
    return { path, content, decodedTitle, category_id, subscription: nSubscription };
  }));

  // construct email
  return {
    from: 'Commonwealth <no-reply@commonwealth.im>',
    to: null,
    bcc: null,
    templateId: DynamicTemplate.BatchNotifications,
    dynamic_template_data: {
      notifications: emailObjArray,
      subject: `New Commonwealth activity: ${notifications.length === 1 ? 'item' : 'items'}`,
      user: user.email,
    },
  };
};

export const sendImmediateNotificationEmail = async (subscription, emailObject) => {
  const user = await subscription.getUser();
  if (!emailObject) return;
  // emailObject.to = (process.env.NODE_ENV === 'development') ? 'raymond@commonwealth.im' : user.email;
  emailObject.to = 'raymond@commonwealth.im';
  emailObject.bcc = 'raymond@commonwealth.im';

  try {
    await sgMail.send(emailObject);
  } catch (e) {
    log.error(e);
  }
};

export const sendBatchedNotificationEmails = async (models) => {
  log.info('Sending daily notification emails');

  const users = await models.User.findAll({
    where: { emailNotificationInterval: 'daily' }
  });

  log.info(`Sending to ${users.length} users`);
  await Promise.all(users.map(async (user) => {
    const notifications = await models.Notification.findAll({
      include: [{
        model: models.Subscription,
        where: { subscriber_id: user.id },
      }],
      where: { is_read: false }
    });
    const emailObject = await createNotificationDigestEmailObject(user, notifications);
    // emailObject.to = (process.env.NODE_ENV === 'development') ? 'raymond@commonwealth.im' : user.email;
    emailObject.to = 'raymond@commonwealth.im';
    emailObject.bcc = 'raymond@commonwealth.im';
    try {
      await sgMail.send(emailObject);
    } catch (e) {
      log.error(e);
    }
  }));
};
