import {
  StatsDController,
  formatFilename,
  loggerFactory,
} from '@hicommonwealth/adapters';
import { NotificationCategories } from '@hicommonwealth/core';
import { NotificationDataAndCategory } from '../../../../shared/types';
import { SubscriptionInstance } from '../../../models/subscription';
import { rollbar } from '../../rollbar';
import { sendEmails } from '../util';
import { createEmailObject } from './createEmailObject';

const log = loggerFactory.getLogger(formatFilename(__filename));

/**
 * This function assumes that the subscriptions provided match the given notification. For example,
 * if a new-thread-creation notification is given in the 'dydx' community then all subscriptions
 * must have the same category and community_id = 'dydx'. This function will however ensure that
 * each subscription should receive emails.
 */
export async function dispatchImmediateEmails(
  notification: NotificationDataAndCategory,
  subscriptions: SubscriptionInstance[],
) {
  if (
    notification.categoryId === NotificationCategories.SnapshotProposal ||
    notification.categoryId === NotificationCategories.CommentEdit ||
    notification.categoryId === NotificationCategories.ThreadEdit
  ) {
    log.warn(`${notification.categoryId} emails not supported!`);
    return;
  }

  const emailSubs: SubscriptionInstance[] = [];
  for (const sub of subscriptions) {
    if (sub.immediate_email) {
      emailSubs.push(sub);
    }
  }

  const emailObject = await createEmailObject(notification, emailSubs);

  try {
    console.log(emailObject);
    await sendEmails(emailObject);
    StatsDController.get().increment('emails.immediate.sent');
  } catch (e) {
    const msg = `Failed to send emails for the following notification ${JSON.stringify(
      notification,
    )}`;
    log.error(msg, e);
    rollbar.error(msg, e);
  }
}
