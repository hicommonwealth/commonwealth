import Sequelize from 'sequelize';
import moment from 'moment';
import {
  SubstrateTypes, MolochTypes, SubstrateEvents, MolochEvents,
  IEventLabel, IEventTitle, IChainEventData, chainSupportedBy
} from '@commonwealth/chain-events';

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
    if (!chainEventLabel) return;

    const subject = `${chainEventLabel.heading} event on ${notification_data.chainEventType?.chain}`;

    return {
      from: 'Commonwealth <no-reply@commonwealth.im>',
      to: null,
      bcc: null,
      subject,
      templateId: DynamicTemplate.ImmediateEmailNotification,
      dynamic_template_data: {
        notification: {
          chainId: notification_data.chainEventType?.chain,
          blockNumber: notification_data.chainEvent?.blockNumber,
          label: chainEventLabel.heading,
          path: `https://commonwealth.im${chainEventLabel.linkUrl}`,
        }
      }
    };
  } else {
    if (category_id === NotificationCategories.NewReaction || category_id === NotificationCategories.ThreadEdit) return;
    const [
      emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath
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
          proposalPath,
          authorPath,
        }
      }
    };
  }
};

const createNotificationDigestEmailObject = async (user, notifications, models) => {
  const emailObjArray = await Promise.all(notifications.map(async (n) => {
    const s = await n.getSubscription();
    const { category_id } = s;

    if (n.chain_event_id) {
      const chainEvent = await models.ChainEvent.findOne({
        where: { id: n.chain_event_id }
      });
      if (!chainEvent) return {};

      let label;
      if (chainSupportedBy(s.chain_id, SubstrateTypes.EventChains)) {
        label = SubstrateEvents.Label(
          chainEvent.blockNumber,
          s.chain_id,
          chainEvent.event_data,
        );
      } else if (chainSupportedBy(s.chain_id, MolochTypes.EventChains)) {
        label = MolochEvents.Label(
          chainEvent.blockNumber,
          s.chain_id,
          chainEvent.event_data,
        );
      }
      if (!label) return {};

      const path = `https://commonwealth.im/${s.chain_id}/notifications`;
      let createdAt = moment(n.created_at).fromNow();
      if (createdAt === 'a day ago') createdAt = `${moment(Date.now()).diff(n.created_at, 'hours')} hours ago`;
      return {
        chainId: s.chain_id,
        blockNumber: chainEvent.blockNumber,
        label: label.heading,
        path: `https://commonwealth.im${label.linkUrl}`,
        createdAt,
      }
    } else {
      const notification_data = JSON.parse(n.notification_data);
      const [
        emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath
      ] = await getForumNotificationCopy(models, notification_data as IPostNotificationData, category_id);

      let createdAt = moment(n.created_at).fromNow();
      if (createdAt === 'a day ago') createdAt = `${moment(Date.now()).diff(n.created_at, 'hours')} hours ago`;
      return {
        author: subjectCopy,
        action: actionCopy,
        rootObject: objectCopy,
        community: communityCopy,
        excerpt,
        proposalPath,
        authorPath,
        createdAt,
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

export const sendBatchedNotificationEmails = async (models): Promise<number> => {
  log.info('Sending daily notification emails');

  try {
    const users = await models.User.findAll({
      where: { emailNotificationInterval: 'daily' }
    });

    log.info(`Sending to ${users.length} users`);

    const { Op } = models.sequelize;
    const last24hours = new Date((new Date() as any) - 24 * 60 * 60 * 1000);
    await Promise.all(users.map(async (user) => {
      const notifications = await models.Notification.findAll({
        include: [{
          model: models.Subscription,
          where: { subscriber_id: user.id },
        }],
        where: {
          // is_read: false,
          created_at: { [Op.gt]: last24hours },
        },
        order: [
          ['created_at', 'DESC'],
        ]
      });
      if (notifications.length === 0) {
        console.log(`empty digest for ${user.email}`);
        return; // don't notify if no new notifications in the last 24h
      }

      // send notification email
      try {
        console.log(`producing digest for ${user.email}`);
        const emailObject = await createNotificationDigestEmailObject(user, notifications, models);
        emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
        emailObject.bcc = 'raymond+bcc@commonwealth.im';

        console.log(`sending batch notification email to ${user.email}`);
        await sgMail.send(emailObject);
      } catch (e) {
        console.log('Failed to send batch notification email', e);
      }
    }));
    return 0;
  } catch (e) {
    console.log(e.message);
    return 1;
  }
};
