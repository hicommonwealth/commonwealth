import { DB } from '../../models';
import { NotificationDataAndCategory } from 'types';
import {
  isDiscordWebhookEndpoint,
  sendDiscordWebhook,
} from './webhookEndpointUtil/discord';
import { Op } from 'sequelize';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { WebhookInstance } from '../../models/webhook';
import { ProfileAttributes, ProfileInstance } from '../../models/profile';
import { SERVER_URL } from '../../config';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Fetch all webhooks that are subscribed to the notification category and chain of the notification object.
 */
async function fetchWebhooks(
  models: DB,
  notifDataCategory: Exclude<
    NotificationDataAndCategory,
    { categoryId: NotificationCategories.SnapshotProposal }
  >
): Promise<WebhookInstance[]> {
  let chainId: string;
  if (notifDataCategory.categoryId === NotificationCategories.ChainEvent) {
    chainId = notifDataCategory.data.chain;
  } else {
    chainId = notifDataCategory.data.chain_id;
  }

  return await models.Webhook.findAll({
    where: {
      chain_id: chainId,
      categories: {
        [Op.contains]: [notifDataCategory.categoryId],
      },
    },
  });
}

/**
 * Get the profile of the user associated with the notification objects author address. For example,
 * a new thread notification would return the profile of the user who created the thread.
 */
async function getActorProfile(
  models: DB,
  notif: Exclude<
    NotificationDataAndCategory,
    { categoryId: NotificationCategories.SnapshotProposal }
  >
): Promise<ProfileAttributes | null> {
  if (notif.categoryId === NotificationCategories.ChainEvent) {
    return null;
  }

  const address = await models.Address.findOne({
    where: {
      address: notif.data.author_address,
      chain: notif.data.chain_id,
    },
    include: [models.Profile],
  });

  if (!address) {
    // TODO: rollbar
    log.error(
      `Could not find address for notification ${JSON.stringify(notif)}`
    );
    return null;
  }

  if (!address.Profile) {
    // TODO: rollbar?
    log.warn(`Could not find profile for address ${JSON.stringify(address)}`);
    return null;
  }

  return address.Profile;
}

export async function dispatchWebhooks(
  models: DB,
  notifDataCategory: NotificationDataAndCategory
) {
  if (
    notifDataCategory.categoryId === NotificationCategories.SnapshotProposal
  ) {
    log.warn('Snapshot proposal webhook notifications not supported');
    return;
  }

  const webhooks = await fetchWebhooks(models, notifDataCategory);

  const actorProfile = await getActorProfile(models, notifDataCategory);
  const actorName = actorProfile?.profile_name;
  const actorProfileLink = actorProfile
    ? `${SERVER_URL}/profile/id/${actorProfile.id}`
    : null;
  const actorAvatarUrl = actorProfile?.avatar_url;

  const webhookPromises = [];
  for (const webhook of webhooks) {
    if (isDiscordWebhookEndpoint(webhook)) {
      webhookPromises.push(
        sendDiscordWebhook(webhook.url, notifDataCategory, actorName)
      );
    }
  }
}
