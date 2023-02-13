import type {
  CWEvent,
  IChainEventData,
  SupportedNetwork,
} from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';

import { factory, formatFilename } from 'common-common/src/logging';
import { NotificationCategories } from 'common-common/src/types';
import { capitalize } from 'lodash';
import { Op } from 'sequelize';
import { getForumNotificationCopy } from '../../shared/notificationFormatter';
import type { IPostNotificationData } from '../../shared/types';
import { DynamicTemplate } from '../../shared/types';
import { SENDGRID_API_KEY } from '../config';
import type { UserAttributes } from '../models/user';

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
