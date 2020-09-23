import Sequelize from 'sequelize';
import {
  SubstrateTypes, MolochTypes,
  SubstrateEvents, MolochEvents, IEventLabel, IEventTitle, IChainEventData } from '@commonwealth/chain-events';

import { SENDGRID_API_KEY, SERVER_URL } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import { getForumNotificationCopy } from '../../shared/notificationFormatter';
import {
  IPostNotificationData, NotificationCategories,
  DynamicTemplate, IChainEventNotificationData
} from '../../shared/types';

const log = factory.getLogger(formatFilename(__filename));

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

export const createImmediateNotificationEmailObject = async (notification_data, category_id, models) => {
  if (notification_data.chainEvent !== undefined) {
    let chainEventLabel: IEventLabel;
    // chainEventLabel?.label
    // chainEventLabel?.heading

    if (SubstrateTypes.EventChains.includes(notification_data.chainEventType?.chain)) {
      chainEventLabel = SubstrateEvents.Label(
        notification_data.chainEvent?.blockNumber,
        notification_data.chainEventType?.chain,
        (notification_data as IChainEventNotificationData).chainEvent.event_data as IChainEventData
      );
    } else if (MolochTypes.EventChains.includes(notification_data.chainEventType?.chain)) {
      chainEventLabel = MolochEvents.Label(
        notification_data.chainEvent?.blockNumber,
        notification_data.chainEventType?.chain,
        (notification_data as IChainEventNotificationData).chainEvent.event_data,
      );
    }
    // TODO: send chain event immediate notification email
  } else {
    if (category_id === NotificationCategories.NewReaction || category_id === NotificationCategories.ThreadEdit) return;
    const [
      emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, path
    ] = await getForumNotificationCopy(models, notification_data as IPostNotificationData, category_id);
    return {
      from: 'Commonwealth <no-reply@commonwealth.im>',
      to: null,
      bcc: null,
      subject: emailSubjectLine,
      templateId: DynamicTemplate.ImmediateEmailNotification,
      dynamic_template_data: {
        notification: {
          subject: emailSubjectLine,
          author: subjectCopy,
          action: actionCopy,
          rootObject: objectCopy,
          community: communityCopy,
          excerpt,
          path,
        }
      }
    };
  }
};

const createNotificationDigestEmailObject = async (user, notifications, models) => {
  const emailObjArray = await Promise.all(notifications.map(async (n) => {
    const { category_id } = await n.getSubscription();
    const notification_data = JSON.parse(n.notification_data);

    if (notification_data.chain_event) {
      // TODO: implement chain event
    } else {
      const [
        emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, path
      ] = await getForumNotificationCopy(models, notification_data as IPostNotificationData, category_id);
      return {
        author: subjectCopy,
        action: actionCopy,
        rootObject: objectCopy,
        community: communityCopy,
        excerpt,
        path,
      };
    }
  }));

  // construct email
  return {
    from: 'Commonwealth <no-reply@commonwealth.im>',
    to: null,
    bcc: null,
    templateId: DynamicTemplate.BatchNotifications,
    dynamic_template_data: {
      notifications: emailObjArray,
      subject: `${notifications.length} new notification${notifications.length === 1 ? '' : 's'}`,
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

export const sendBatchedNotificationEmails = (models) => {
  log.info('Sending daily notification emails');

  models.User.findAll({
    where: { emailNotificationInterval: 'daily' }
  }).then((users) => {
    log.info(`Sending to ${users.length} users`);
    Promise.all(users.map(async (user) => {
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
        console.log(`sending batch notification email to ${user.email}`);
        await sgMail.send(emailObject);
      } catch (e) {
        console.log('Failed to send batch notification email', e?.response?.body?.errors);
        console.log(log.error(e));
      }
    })).then(() => {
      process.exit(0);
    }).catch((err) => {
      console.log(err);
      process.exit(1);
    });
  }).catch((err) => {
    console.log(err);
    process.exit(1);
  });
};
