import { Op } from 'sequelize';
import moment from 'moment';
import { capitalize } from 'lodash';
import {
  Label as ChainEventLabel, CWEvent, IEventLabel, SupportedNetwork, IChainEventData
} from 'chain-events/src';

import { factory, formatFilename } from 'common-common/src/logging';
import { NotificationCategories } from 'common-common/src/types';
import { SENDGRID_API_KEY, } from '../config';
import { getForumNotificationCopy } from '../../shared/notificationFormatter';
import { IPostNotificationData, DynamicTemplate } from '../../shared/types';
import { DB } from '../database';
import { UserAttributes } from '../models/user';

const log = factory.getLogger(formatFilename(__filename));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

export const createImmediateNotificationEmailObject = async (notification_data, category_id, models) => {
  if (notification_data.chainEvent && notification_data.chainEventType) {
    // construct compatible CW event from DB by inserting network from type
    const evt: CWEvent = {
      blockNumber: notification_data.chainEvent.block_number,
      data: notification_data.chainEvent.event_data as IChainEventData,
      network: notification_data.chainEventType.event_network as SupportedNetwork,
    };

    try {
      const chainEventLabel = ChainEventLabel(notification_data.chainEventType.chain, evt);
      if (!chainEventLabel) return;

      const subject = `${process.env.NODE_ENV !== 'production' ? '[dev] ' : ''
        }${chainEventLabel.heading} event on ${capitalize(notification_data.chainEventType.chain)}`;

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
          }
        }
      };
    } catch (err) {
      console.error(`Failed to label chain event: ${err.message}`);
    }
  } else if (category_id !== NotificationCategories.NewReaction && category_id !== NotificationCategories.ThreadEdit) {
    const [
      emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath
    ] = await getForumNotificationCopy(models, notification_data as IPostNotificationData, category_id);
    return {
      from: 'Commonwealth <no-reply@commonwealth.im>',
      to: null,
      bcc: null,
      subject: (process.env.NODE_ENV !== 'production' ? '[dev] ' : '') + emailSubjectLine,
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

const createNotificationDigestEmailObject = async (user, notifications, models: DB) => {
  // const emailObjArray = await Promise.all(notifications.map(async (n) => {
  //   const s = await n.getSubscription();
  //   const { category_id } = s;
  //
  //   if (n.chain_event_id) {
  //     const chainEvent = await models.ChainEvent.findOne({
  //       where: { id: n.chain_event_id },
  //       include: [{
  //         model: models.ChainEventType,
  //         required: true,
  //         as: 'ChainEventType',
  //       }]
  //     });
  //     if (!chainEvent) return {};
  //
  //     // construct compatible CW event from DB by inserting network from type
  //     const evt: CWEvent = {
  //       blockNumber: chainEvent.block_number,
  //       data: chainEvent.event_data as IChainEventData,
  //       network: chainEvent.ChainEventType.event_network as SupportedNetwork,
  //     };
  //
  //     let label: IEventLabel;
  //     try {
  //       label = ChainEventLabel(s.chain_id, evt);
  //     } catch (e) {
  //       return {};
  //     }
  //
  //     const path = `https://commonwealth.im/${s.chain_id}/notifications`;
  //     let createdAt = moment(n.created_at).fromNow();
  //     if (createdAt === 'a day ago') createdAt = `${moment(Date.now()).diff(n.created_at, 'hours')} hours ago`;
  //     return {
  //       chainId: s.chain_id,
  //       blockNumber: chainEvent.block_number,
  //       label: label.heading,
  //       path: `https://commonwealth.im${label.linkUrl}`,
  //       createdAt,
  //     };
  //   } else {
  //     const notification_data = JSON.parse(n.notification_data);
  //     const [
  //       emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath
  //     ] = await getForumNotificationCopy(models, notification_data as IPostNotificationData, category_id);
  //
  //     if (actionCopy === null) return; // don't return notification object if object no-longer exists
  //
  //     let createdAt = moment(n.created_at).fromNow();
  //     if (createdAt === 'a day ago') createdAt = `${moment(Date.now()).diff(n.created_at, 'hours')} hours ago`;
  //     return {
  //       author: subjectCopy,
  //       action: actionCopy,
  //       rootObject: objectCopy,
  //       community: communityCopy,
  //       excerpt,
  //       proposalPath,
  //       authorPath,
  //       createdAt,
  //     };
  //   }
  // }));

  // // construct email
  // return {
  //   from: 'Commonwealth <no-reply@commonwealth.im>',
  //   to: null,
  //   bcc: null,
  //   templateId: DynamicTemplate.BatchNotifications,
  //   dynamic_template_data: {
  //     notifications: emailObjArray,
  //     subject: `${process.env.NODE_ENV !== 'production' ? '[dev] ' : ''
  //     }${notifications.length} new notification${notifications.length === 1 ? '' : 's'}`,
  //     user: user.email,
  //   },
  // };
};

export const sendImmediateNotificationEmail = async (
  user: UserAttributes,
  emailObject
) => {
  if (!emailObject) {
    console.log('attempted to send empty immediate notification email');
    return;
  }
  emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
  emailObject.bcc = 'raymond+bcc@commonwealth.im';

  try {
    console.log(`sending immediate notification email to ${emailObject.to}`);
    await sgMail.send(emailObject);
  } catch (e) {
    console.log('Failed to send immediate notification email', e?.response?.body?.errors);
    log.error(e);
  }
};

export const sendBatchedNotificationEmails = async (models): Promise<number> => {
  log.info('Sending daily notification emails');

  try {
    const users = await models.User.scope('withPrivateData').findAll({
      where: { emailNotificationInterval: 'daily' }
    });

    log.info(`Sending to ${users.length} users`);

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
        // const emailObject = await createNotificationDigestEmailObject(user, notifications, models);
        // emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
        // emailObject.bcc = 'raymond+bcc@commonwealth.im';

        // console.log(`sending batch notification email to ${user.email}`);
        // await sgMail.send(emailObject);
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
