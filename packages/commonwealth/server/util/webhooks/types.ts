import { NotificationCategories } from 'common-common/src/types';

export interface ForumWebhookData {
  communityId: string;
  // title of the webhook data notification
  // (usually an action combined with the title of the object)
  // e.g. "New comment on: <thread title>"
  title: string;
  previewImageUrl: string;

  profileName: string;
  profileUrl: string;
  profileAvatarUrl: string;

  objectUrl: string;
  objectSummary: string;
}

export interface ChainEventWebhookData {
  title: string;
  description: string;
  url: string;
  previewImageUrl: string;
}

export type WebhookDataByCategory<C extends NotificationCategories> =
  C extends NotificationCategories.ChainEvent
    ? ChainEventWebhookData
    : ForumWebhookData;
