import { NotificationCategories } from '@hicommonwealth/core';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import {
  DynamicTemplate,
  NotificationDataAndCategory,
} from '../../../../shared/types';
import { SubscriptionInstance } from '../../../models/subscription';
import {
  ChainEventEmailData,
  ForumEmailData,
  getEmailData,
} from './getEmailData';

export async function createEmailObject(
  notification: Exclude<
    NotificationDataAndCategory,
    | { categoryId: NotificationCategories.SnapshotProposal }
    | { categoryId: NotificationCategories.ThreadEdit }
    | { categoryId: NotificationCategories.CommentEdit }
  >,
  emailSubscriptions: SubscriptionInstance[],
): Promise<MailDataRequired> {
  const from = 'Commonwealth <no-reply@commonwealth.im>';
  const to = emailSubscriptions.map((s) => s.User.email);

  if (notification.categoryId === NotificationCategories.ChainEvent) {
    const emailData = (await getEmailData(notification)) as ChainEventEmailData;
    return {
      from,
      to,
      subject: emailData.emailSubject,
      templateId: DynamicTemplate.ImmediateEmailNotification,
      dynamicTemplateData: {
        notification: {
          chainId: emailData.community_id,
          blockNumber: emailData.blockNumber,
          subject: emailData.emailSubject,
          label: emailData.label,
          path: emailData.url,
        },
      },
    };
  } else {
    const emailData = (await getEmailData(notification)) as ForumEmailData;
    return {
      from,
      to,
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
