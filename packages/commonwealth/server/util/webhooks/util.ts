import { logger } from '@hicommonwealth/logging';
import {
  CommunityInstance,
  ProfileAttributes,
  WebhookInstance,
  models,
} from '@hicommonwealth/model';
import {
  NotificationCategories,
  NotificationDataAndCategory,
  slugify,
} from '@hicommonwealth/shared';
import { fileURLToPath } from 'node:url';
import { Op } from 'sequelize';
import { DEFAULT_COMMONWEALTH_LOGO, SERVER_URL } from '../../config';
import { WebhookDestinations } from './types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export const REGEX_IMAGE =
  /\b(https?:\/\/\S*?\.(?:png|jpe?g|gif)(?:\?(?:(?:(?:[\w_-]+=[\w_-]+)(?:&[\w_-]+=[\w_-]+)*)|(?:[\w_-]+)))?)\b/;
export const REGEX_EMOJI =
  /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;

/**
 * Fetch all webhooks that are subscribed to the notification category and chain of the notification object.
 */
export async function fetchWebhooks(
  notifDataCategory: Exclude<
    NotificationDataAndCategory,
    { categoryId: NotificationCategories.SnapshotProposal }
  >,
): Promise<WebhookInstance[]> {
  return await models.Webhook.findAll({
    where: {
      community_id: notifDataCategory.data.community_id,
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
export async function getActorProfile(
  notif: Exclude<
    NotificationDataAndCategory,
    { categoryId: NotificationCategories.SnapshotProposal }
  >,
): Promise<ProfileAttributes | null> {
  if (notif.categoryId === NotificationCategories.ChainEvent) {
    return null;
  }

  const address = await models.Address.findOne({
    where: {
      address: notif.data.author_address,
      community_id: notif.data.community_id,
    },
    include: [models.Profile],
  });

  if (!address) {
    // TODO: rollbar
    log.error(
      `Could not find address for notification ${JSON.stringify(notif)}`,
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

export async function getPreviewImageUrl(
  notification: Exclude<
    NotificationDataAndCategory,
    { categoryId: NotificationCategories.SnapshotProposal }
  >,
  community?: CommunityInstance,
): Promise<{ previewImageUrl: string; previewAltText: string }> {
  // case 1: embedded imaged in thread body
  if (
    notification.categoryId !== NotificationCategories.ChainEvent &&
    notification.categoryId !== NotificationCategories.ThreadEdit &&
    notification.categoryId !== NotificationCategories.CommentEdit
  ) {
    const bodytext = decodeURIComponent(notification.data.comment_text);
    const matches = bodytext.match(REGEX_IMAGE);
    if (matches) {
      return { previewImageUrl: matches[0], previewAltText: 'Embedded' };
    }
  }

  // case 2: community icon
  if (community?.icon_url) {
    const previewImageUrl = community.icon_url.match(`^(http|https)://`)
      ? community.icon_url
      : `https://commonwealth.im${community.icon_url}`;
    const previewAltText = `${community.name}`;
    return { previewImageUrl, previewAltText };
  }

  // case 3: default commonwealth logo
  return {
    previewImageUrl: DEFAULT_COMMONWEALTH_LOGO,
    previewAltText: 'Commonwealth',
  };
}

export function getThreadUrlFromNotification(
  notification: Exclude<
    NotificationDataAndCategory,
    | { categoryId: NotificationCategories.ChainEvent }
    | { categoryId: NotificationCategories.SnapshotProposal }
    | { categoryId: NotificationCategories.ThreadEdit }
    | { categoryId: NotificationCategories.CommentEdit }
  >,
): string {
  let commentId = '';
  if (notification.categoryId === NotificationCategories.NewComment) {
    commentId = `?comment=${notification.data.comment_id}`;
  }

  const data = notification.data;
  return `${SERVER_URL}/${data.community_id}/discussion/${
    data.thread_id
  }-${slugify(data.root_title)}${commentId}`;
}

export function getWebhookDestination(webhookUrl: string): WebhookDestinations {
  if (webhookUrl.includes('discord.com/api/webhooks')) {
    return WebhookDestinations.Discord;
  } else if (webhookUrl.includes('hooks.slack.com')) {
    return WebhookDestinations.Slack;
  } else if (webhookUrl.includes('api.telegram.org')) {
    return WebhookDestinations.Telegram;
  } else if (webhookUrl.includes('hooks.zapier.com/')) {
    return WebhookDestinations.Zapier;
  } else {
    return WebhookDestinations.Unknown;
  }
}
