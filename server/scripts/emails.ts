import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY } from '../config';
import { factory, formatFilename } from '../util/logging';
import { getProposalUrl } from '../../shared/utils';
const log = factory.getLogger(formatFilename(__filename));

import { IPostNotificationData, NotificationCategories } from '../../shared/types';
sgMail.setApiKey(SENDGRID_API_KEY);

export const sendImmediateNotificationEmail = async (subscription, emailObject) => {
  const user = await subscription.getUser();
  emailObject.to = (process.env.NODE_ENV === 'development') ? 'zak@commonwealth.im' : user.email; // user.email

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
    text: `${subjectLine}. <a href='${path}'>Click here</a>`,
    html: `${subjectLine}. <a href='${path}'>Click here</a>`,
  };
  return msg;
};
