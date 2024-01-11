import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import { NotificationCategories } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { NotificationDataAndCategory } from '../../../shared/types';
import { slugify } from '../../../shared/utils';
import { DEFAULT_COMMONWEALTH_LOGO, SERVER_URL } from '../../config';
import models from '../../database';
import { CommunityInstance } from '../../models/community';
import { ProfileAttributes } from '../../models/profile';
import { WebhookInstance } from '../../models/webhook';
import { WebhookDestinations } from './types';

const log = loggerFactory.getLogger(formatFilename(__filename));

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
  let chainId: string;
  if (notifDataCategory.categoryId === NotificationCategories.ChainEvent) {
    chainId = notifDataCategory.data.chain;
  } else {
    chainId = notifDataCategory.data.chain_id;
  }

  return await models.Webhook.findAll({
    where: {
      community_id: chainId,
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
      community_id: notif.data.chain_id,
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
  chain?: CommunityInstance,
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

  // case 2: chain icon
  if (chain?.icon_url) {
    const previewImageUrl = chain.icon_url.match(`^(http|https)://`)
      ? chain.icon_url
      : `https://commonwealth.im${chain.icon_url}`;
    const previewAltText = `${chain.name}`;
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
  return `${SERVER_URL}/${data.chain_id}/discussion/${data.thread_id}-${slugify(
    data.root_title,
  )}${commentId}`;
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
