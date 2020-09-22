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

export const createImmediateNotificationEmailObject = async (
  notification_data: IPostNotificationData | IChainEventNotificationData,
  category_id,
  models,
) => {
  let chainEventLabel: IEventLabel;
  const chainId = (notification_data as IChainEventNotificationData).chainEventType?.chain;

  // skip notification categories without emails
  if (category_id === NotificationCategories.NewReaction
      || category_id === NotificationCategories.ThreadEdit) return;

  // enrich chain event notifications, using labeler from @commonwealth/chain-events
  // all other notifications just use the thread title
  if ((notification_data as IChainEventNotificationData).chainEvent !== undefined) {
    const { blockNumber } = (notification_data as IChainEventNotificationData).chainEvent;
    if (SubstrateTypes.EventChains.includes(chainId) && chainId !== 'polkadot') {
      chainEventLabel = SubstrateEvents.Label(
        blockNumber,
        chainId,
        (notification_data as IChainEventNotificationData).chainEvent.event_data as IChainEventData
      );
    // } else if (MolochTypes.EventChains.includes(chainId)) {
    //   chainEventLabel = MolochEvents.Label(
    //     blockNumber,
    //     chainId,
    //     (notification_data as IChainEventNotificationData).chainEvent.event_data,
    //   );
    }
  }

  // assemble email fields
  const { created_at, root_id, root_title, root_type, comment_id, comment_text,
    chain_id, community_id, author_address, author_chain } = (notification_data as IPostNotificationData);

  const decodedTitle = decodeURIComponent(root_title).trim();
  const subjectLine = (chainEventLabel?.heading)
    || ((category_id === NotificationCategories.NewComment) ? `New comment on '${decodedTitle}'`
      : (category_id === NotificationCategories.NewMention) ? `New mention on '${decodedTitle}'`
        : (category_id === NotificationCategories.NewThread) ? `New thread: ${decodedTitle}`
          : 'New activity on Commonwealth');

  // fetch author
  const authorProfile = await models.OffchainProfile.findOne({
    include: [{
      model: models.Address,
      where: { address: author_address, chain: author_chain },
      required: true,
    }]
  });
  let authorName;
  try {
    authorName = authorProfile.Address.name || JSON.parse(authorProfile.data).name || 'Someone';
  } catch (e) {
    authorName = 'Someone';
  }

  // fetch action and community
  const actionCopy = (chainEventLabel?.heading)
    || ((category_id === NotificationCategories.NewComment) ? 'commented on'
      : (category_id === NotificationCategories.NewMention) ? 'mentioned you in the thread'
        : (category_id === NotificationCategories.NewThread) ? 'created a new thread'
          : '');
  const objectCopy = decodeURIComponent(root_title).trim();
  const communityObject = chain_id
    ? await models.Chain.findOne({ where: { id: chain_id } })
    : await models.OffchainCommunity.findOne({ where: { id: community_id } });
  const communityCopy = communityObject ? ` in ${communityObject.name}:` : ':';
  const excerpt = decodeURIComponent(comment_text); // TODO: unpack Markdown and Quill

  // construct link
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
    community: community_id,
  };
  const proposalUrlArgs = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
  const path = chainEventLabel?.linkUrl ? `${SERVER_URL}${chainEventLabel.linkUrl}`
    : chainEventLabel ? `${SERVER_URL}/${chainId}`
      : (getProposalUrl as any)(...proposalUrlArgs);

  // construct email
  const emailData = {
    notification: {
      // email subject:
      subject: subjectLine,
      // email body:
      author: authorName,
      action: actionCopy,
      rootObject: objectCopy,
      community: communityCopy,
      excerpt,
      path,
      // used for chain notifications:
      // title: chainEventLabel?.heading || subjectLine,
      // body: chainEventLabel?.label || subjectLine,
    }
  };
  return {
    from: 'Commonwealth <no-reply@commonwealth.im>',
    to: null,
    bcc: null,
    subject: subjectLine,
    templateId: DynamicTemplate.ImmediateEmailNotification,
    dynamic_template_data: emailData,
  };
};

const createNotificationDigestEmailObject = async (user, notifications, models) => {
  const emailObjArray = await Promise.all(notifications.map(async (n) => {
    const { created_at, root_id, root_title, root_type, comment_id, comment_text,
      chain_id, community_id, author_address, author_chain } = JSON.parse(n.notification_data);
    const { category_id } = await n.getSubscription();

    // fetch author
    const authorProfile = await models.OffchainProfile.findOne({
      include: [{
        model: models.Address,
        where: { address: author_address, chain: author_chain },
        required: true,
      }]
    });
    let authorName;
    try {
      authorName = authorProfile.Address.name || JSON.parse(authorProfile.data).name || 'Someone';
    } catch (e) {
      authorName = 'Someone';
    }

    // fetch name
    const actionCopy = (category_id === NotificationCategories.NewComment) ? 'commented on'
      : (category_id === NotificationCategories.NewMention) ? 'mentioned you in the thread'
        : (category_id === NotificationCategories.NewThread) ? 'created a new thread'
          : '';
    const objectCopy = decodeURIComponent(root_title).trim();
    const communityObject = chain_id
      ? await models.Chain.findOne({ where: { id: chain_id } })
      : await models.OffchainCommunity.findOne({ where: { id: community_id } });
    const communityCopy = communityObject ? ` in ${communityObject.name}:` : ':';
    const excerpt = decodeURIComponent(comment_text); // TODO: unpack Markdown and Quill

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
    return {
      // email body:
      author: authorName,
      action: actionCopy,
      rootObject: objectCopy,
      community: communityCopy,
      excerpt,
      path,
    };
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
  if (!emailObject) {
    console.log('attempted to send empty immediate notification email');
    return;
  }
  emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
  emailObject.bcc = 'raymond+bcc@commonwealth.im';

  try {
    console.log('sending immediate notification email');
    await sgMail.send(emailObject);
  } catch (e) {
    console.log('Failed to send immediate notification email', e?.response?.body?.errors);
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
    const emailObject = await createNotificationDigestEmailObject(user, notifications, models);
    emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
    emailObject.bcc = 'raymond+bcc@commonwealth.im';
    try {
      console.log('sending batch notification email');
      await sgMail.send(emailObject);
    } catch (e) {
      console.log('Failed to send batch notification email', e?.response?.body?.errors);
      log.error(e);
    }
  }));
};
