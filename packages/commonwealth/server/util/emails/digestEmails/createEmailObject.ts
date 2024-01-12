import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import { DynamicTemplate } from 'types';
import { UserInstance } from '../../../models/user';
import { getDigestEmailsData } from './getDigestEmailsData';

export async function createEmailObjects(
  users: UserInstance[],
): Promise<MailDataRequired[]> {
  const from = 'Commonwealth <no-reply@commonwealth.im>';
  const emailsData = await getDigestEmailsData(users);
  const emailObjects: MailDataRequired[] = [];

  for (const [email, userEmailsData] of Object.entries(emailsData)) {
    const emailObject: MailDataRequired = {
      from,
      to: email,
      templateId: DynamicTemplate.BatchNotifications,
      dynamicTemplateData: {
        subject: `${userEmailsData.length} new notification${
          userEmailsData.length > 1 ? 's' : ''
        }`,
        user: email,
      },
    };
    const userEmailObjects = [];
    for (const emailData of userEmailsData) {
      if (emailData.type === 'chain-event') {
        userEmailObjects.push({
          chainId: emailData.data.community_id,
          blockNumber: emailData.data.blockNumber,
          subject: emailData.data.emailSubject,
          label: emailData.data.label,
          path: emailData.data.url,
        });
      } else {
        userEmailObjects.push({
          subject: emailData.data.emailSubject,
          author: emailData.data.profileName,
          authorPath: emailData.data.profileUrl,
          action: emailData.data.actionCopy,
          community: emailData.data.communityCopy,
          rootObject: emailData.data.objectTitle,
          excerpt: emailData.data.objectSummary,
          proposalPath: emailData.data.objectUrl,
        });
      }
    }
    emailObject.dynamicTemplateData.notifications = userEmailObjects;

    emailObjects.push(emailObject);
  }

  return emailObjects;
}
