import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import { factory, formatFilename } from 'common-common/src/logging';
import { NotificationCategories } from 'common-common/src/types';
import {
  DynamicTemplate,
  NotificationDataAndCategory,
} from '../../../../shared/types';
import { SubscriptionInstance } from '../../../models/subscription';
import { getEmailData } from './getEmailData';

const log = factory.getLogger(formatFilename(__filename));

export async function createEmailObject(
  notification: Exclude<
    NotificationDataAndCategory,
    | { categoryId: NotificationCategories.SnapshotProposal }
    | { categoryId: NotificationCategories.ThreadEdit }
    | { categoryId: NotificationCategories.CommentEdit }
  >,
  emailSubscriptions: SubscriptionInstance[]
): Promise<MailDataRequired> {
  if (notification.categoryId === NotificationCategories.ChainEvent) {
  } else {
    const emailData = await getEmailData(notification);
    return {
      from: 'Commonwealth <no-reply@commonwealth.im>',
      to: emailSubscriptions.map((s) => s.User.email),
      subject: emailData.emailSubject,
      templateId: DynamicTemplate.ImmediateEmailNotification,
      dynamicTemplateData: {
        notification: {
          subject: emailData.emailSubject,
          author: emailData.profileName,
          authorPath: emailData.profileUrl,
          action: emailData.actionCopy,
          community: emailData.communityCopy,
          rootObject: emailData.objectTitle,
          excerpt: emailData.objectSummary,
          proposalPath: emailData.objectUrl,
        },
      },
    };
  }
}
