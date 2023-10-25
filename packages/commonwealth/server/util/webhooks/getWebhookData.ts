import { NotificationDataAndCategory } from '../../../shared/types';
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
import { ChainInstance } from '../../models/chain';

export async function getWebhookData(
  notification: Exclude<
    NotificationDataAndCategory,
    | { categoryId: NotificationCategories.SnapshotProposal }
    | { categoryId: NotificationCategories.ThreadEdit }
    | { categoryId: NotificationCategories.CommentEdit }
  >,
  chain?: ChainInstance
): Promise<ForumWebhookData | ChainEventWebhookData> {
  if (notification.categoryId === NotificationCategories.ChainEvent) {
    const event = {
      blockNumber: notification.data.block_number,
      data: notification.data.event_data,
      network: notification.data.network,
      chain: notification.data.chain,
    };
    const eventLabel = chainEventLabel(notification.data.chain, event);

    const previewImage = await getPreviewImageUrl(notification, chain);

    return {
      title: `${eventLabel.heading} on ${capitalize(notification.data.chain)}`,
      description: eventLabel.label,
      url: SERVER_URL + eventLabel.linkUrl,
      previewImageUrl: previewImage.previewImageUrl,
      previewImageAltText: previewImage.previewAltText,
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

    let objectSummary: string;
    if (notification.categoryId !== NotificationCategories.NewReaction) {
      const bodytext = decodeURIComponent(notification.data.comment_text);
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
    } else {
      objectSummary = 'New Like';
    }

    const previewImage = await getPreviewImageUrl(notification);

    return {
      communityId: notification.data.chain_id,
      titlePrefix,
      previewImageUrl: previewImage.previewImageUrl,
      previewImageAltText: previewImage.previewAltText,

      profileName: profile?.profile_name,
      profileUrl: profile ? `${SERVER_URL}/profile/id/${profile.id}` : null,
      profileAvatarUrl: profile?.avatar_url,

      objectTitle: title,
      objectUrl: getThreadUrlFromNotification(notification),
      objectSummary,
    };
  }
}
