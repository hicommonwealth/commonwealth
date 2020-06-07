import Sequelize from 'sequelize';
// import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import { getProposalUrl } from '../../shared/utils';
const { Op } = Sequelize;
// import models from '../database';
const log = factory.getLogger(formatFilename(__filename));

import { IPostNotificationData, NotificationCategories } from '../../shared/types';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

// immediate notification email

export const sendImmediateNotificationEmail = async (subscription, emailObject) => {
  const user = await subscription.getUser();
  emailObject.to = (process.env.NODE_ENV === 'development') ? 'test@commonwealth.im' : user.email;

  try {
    await sgMail.send(emailObject);
  } catch (e) {
    log.error(e);
  }
};

export const createNotificationEmailObject = (notification_data: IPostNotificationData, category_id) => {
  const { created_at, root_id, root_title, root_type, comment_id, comment_text,
    chain_id, community_id, author_address, author_chain } = notification_data;
  const decodedTitle = decodeURIComponent(root_title).trim();
  const subjectLine = (category_id === NotificationCategories.NewComment) ? `New comment on '${decodedTitle}'`
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
  const msg = {
    to: null,
    from: 'Commonwealth <no-reply@commonwealth.im>',
    subject: subjectLine,
    templateId: 'd-7ccab17c309f45dab93b4290b3d396d1',
    text: `${subjectLine}. <a href='${path}'>Click here</a>`,
    html: `${subjectLine}. <a href='${path}'>Click here</a>`,
  };
  return msg;
};

// regular notification email service

export const createRegularNotificationEmailObject = async (user, notifications) => {
  console.dir('create regular notification email object');
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
  console.dir('post-notifications');

  const subjectLine = `${notifications.length} unread notifications on Commonwealth!`;
  const msg = {
    to: 'zak@commonwealth.im', // TODO user.email
    from: 'Commonwealth <no-reply@commonwealth.im>',
    templateId: 'd-468624f3c2d7434c86ae0ed0e1d2227e',
    dynamic_template_data: {
      notifications: emailObjArray,
      subject: 'hello dumbo',
      user: 'zak',
    },
  };
  await sgMail.send(msg);
  return msg;
};

export const sendRegularNotificationEmail = async (models, user) => {
  const NOTLIVE = true;
  console.dir('inside send regular notification emails');

  const subscriptions = await models.Subscription.findAll({
    where: {
      subscriber_id: user.id,
    },
  });
  const subscriptionIds = subscriptions.map((s) => s.id);
  console.dir(`subscriptionsIds: ${subscriptionIds.length}`);
  const notifications = await models.Notification.findAll({
    where: {
      subscription_id: {
        [Op.in]: subscriptionIds,
      },
      is_read: false,
    }
  });
  console.dir(`notifications acquired: ${notifications.length}`);
  const msg = await createRegularNotificationEmailObject(user, notifications);
  console.dir('sending msg');
  // if (NOTLIVE) {
  //   log.info('not live!');
  //   log.info(msg.text);
  // } else {
  //   log.info('live!?!?!?');
  //   msg.to = (process.env.NODE_ENV === 'development') ? 'test@commonwealth.im' : user.email;
  //   await sgMail.send(msg);
  // }
  console.dir('end of send Regular Notification Email');
  return msg;
};

export const sendBatchedNotificationEmails = async (models, interval: string) => {
  console.dir('inside send batched notification emails');
  console.dir(interval);
  const users = await models.User.findAll({
    where: {
      emailNotificationInterval: interval,
    }
  });
  console.dir(`users: ${users.length}`);
  const emails = await Promise.all(users.map(async (user) => {
    await sendRegularNotificationEmail(models, user).then((msg) => { return msg; });
  }));

  console.dir(emails);
};
