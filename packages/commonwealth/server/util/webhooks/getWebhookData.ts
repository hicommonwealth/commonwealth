import { CommunityInstance } from '@hicommonwealth/model';
import {
  NotificationCategories,
  NotificationDataAndCategory,
} from '@hicommonwealth/shared';
import { capitalize } from 'lodash';
import { Label as chainEventLabel } from '../../../shared/chain/labelers/util';
import { renderQuillDeltaToText, smartTrim } from '../../../shared/utils';
import { SERVER_URL } from '../../config';
import { ChainEventWebhookData, ForumWebhookData } from './types';
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
  >,
  community?: CommunityInstance,
): Promise<ForumWebhookData | ChainEventWebhookData> {
  if (notification.categoryId === NotificationCategories.ChainEvent) {
    const event = {
      blockNumber: notification.data.block_number,
      data: notification.data.event_data,
      network: notification.data.network,
      chain: notification.data.community_id,
    };
    const eventLabel = chainEventLabel(notification.data.community_id, event);

    const previewImage = await getPreviewImageUrl(notification, community);

    return {
      title: `${eventLabel.heading} on ${capitalize(
        notification.data.community_id,
      )}`,
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
      communityId: notification.data.community_id,
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
