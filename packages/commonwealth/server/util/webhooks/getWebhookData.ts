import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { ChainEventWebhookData, ForumWebhookData } from './types';
import { Label as chainEventLabel } from 'chain-events/src';
import { capitalize } from 'lodash';
import { renderQuillDeltaToText, smartTrim } from '../../../shared/utils';
import { SERVER_URL } from '../../config';
import {
  getActorProfile,
  getPreviewImageUrl,
  getThreadUrlFromNotification,
} from './util';

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
