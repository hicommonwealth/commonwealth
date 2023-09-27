import { WebhookInstance } from '../../models/webhook';
import { ProfileAttributes } from '../../models/profile';
import models from '../../database';
import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { DEFAULT_COMMONWEALTH_LOGO, SERVER_URL } from '../../config';
import { ChainEventWebhookData, ForumWebhookData } from './types';
import { Label as chainEventLabel } from 'chain-events/src/util';
import { capitalize } from 'lodash';
import { renderQuillDeltaToText, slugify, smartTrim } from 'utils';

const log = factory.getLogger(formatFilename(__filename));

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
export async function getActorProfile(
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

export async function getPreviewImageUrl(
  notification: Exclude<
    NotificationDataAndCategory,
    { categoryId: NotificationCategories.SnapshotProposal }
  >
): Promise<{ previewImageUrl: string; previewAltText: string }> {
  let previewImageUrl: string, previewAltText: string;
  if (notification.categoryId === NotificationCategories.ChainEvent) {
    const chain = await models.Chain.findOne({
      where: {
        id: notification.data.chain,
      },
    });
    if (chain?.icon_url) {
      previewImageUrl = chain.icon_url.match(`^(http|https)://`)
        ? chain.icon_url
        : `https://commonwealth.im${chain.icon_url}`;
      previewAltText = `${chain.name}`;
    }
  } else if (
    notification.categoryId !== NotificationCategories.ThreadEdit &&
    notification.categoryId !== NotificationCategories.CommentEdit
  ) {
    const bodytext = decodeURIComponent(notification.data.comment_text);
    const matches = bodytext.match(REGEX_IMAGE);
    if (matches) {
      previewImageUrl = matches[0];
      previewAltText = 'Embedded';
    }
  }

  if (!previewImageUrl || !previewAltText) {
    previewImageUrl = previewImageUrl || DEFAULT_COMMONWEALTH_LOGO;
    previewAltText = previewAltText || 'Commonwealth';
  }

  return { previewImageUrl, previewAltText };
}

export async function getWebhookData(
  notification: Exclude<
    NotificationDataAndCategory,
    | { categoryId: NotificationCategories.SnapshotProposal }
    | { categoryId: NotificationCategories.ThreadEdit }
    | { categoryId: NotificationCategories.CommentEdit }
  >
): Promise<ForumWebhookData | ChainEventWebhookData> {
  if (notification.categoryId === NotificationCategories.ChainEvent) {
    const event = {
      blockNumber: notification.data.block_number,
      data: notification.data.event_data,
      network: notification.data.network,
      chain: notification.data.chain,
    };
    const eventLabel = chainEventLabel(notification.data.chain, event);

    let description: string;
    if (notification.data.block_number) {
      description =
        `${eventLabel.heading} on ${capitalize(notification.data.chain)}` +
        `at block ${notification.data.block_number} \n${eventLabel.label}`;
    } else {
      description = `${eventLabel.heading} on ${capitalize(
        notification.data.chain
      )} \n${eventLabel.label}`;
    }

    return {
      title: capitalize(notification.data.chain),
      description,
      url: eventLabel.linkUrl,
      previewImageUrl: (await getPreviewImageUrl(notification)).previewImageUrl,
    };
  } else {
    const profile = await getActorProfile(notification);

    let titlePrefix: string;
    switch (notification.categoryId) {
      case NotificationCategories.NewComment:
        titlePrefix = 'Comment on: ';
        break;
      case NotificationCategories.NewThread:
        titlePrefix = 'New thread: ';
        break;
      case NotificationCategories.NewReaction:
        titlePrefix = 'Reaction on: ';
        break;
      default:
        titlePrefix = 'Activity on: ';
    }

    let title: string;
    try {
      title = decodeURIComponent(notification.data.root_title);
    } catch (e) {
      title = notification.data.root_title;
    }

    const bodytext = decodeURIComponent(notification.data.comment_text);

    let objectSummary: string;
    try {
      // parse and use quill document
      const doc = JSON.parse(bodytext);
      if (!doc.ops) throw new Error();
      const text = renderQuillDeltaToText(doc);
      objectSummary = smartTrim(text);
    } catch (err) {
      // use markdown document directly
      objectSummary = smartTrim(bodytext);
    }

    return {
      communityId: notification.data.chain_id,
      previewImageUrl: (await getPreviewImageUrl(notification)).previewImageUrl,

      profileName: profile?.profile_name,
      profileUrl: profile ? `${SERVER_URL}/profile/id/${profile.id}` : null,
      profileAvatarUrl: profile?.avatar_url,

      title: titlePrefix + title,
      objectUrl: getThreadUrlFromNotification(notification),
      objectSummary,
    };
  }
}

function getThreadUrlFromNotification(
  notification: Exclude<
    NotificationDataAndCategory,
    | { categoryId: NotificationCategories.ChainEvent }
    | { categoryId: NotificationCategories.SnapshotProposal }
    | { categoryId: NotificationCategories.ThreadEdit }
    | { categoryId: NotificationCategories.CommentEdit }
  >
): string {
  let commentId = '';
  if (notification.categoryId === NotificationCategories.NewComment) {
    commentId = `?comment=${notification.data.comment_id}`;
  }

  const data = notification.data;
  return `${SERVER_URL}/${data.chain_id}/discussion/${data.thread_id}-${slugify(
    data.root_title
  )}${commentId}`;
}
