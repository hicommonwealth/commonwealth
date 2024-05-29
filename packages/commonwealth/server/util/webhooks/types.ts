import { NotificationCategories } from '@hicommonwealth/shared';

export enum WebhookDestinations {
  Discord = 'discord',
  Slack = 'slack',
  Telegram = 'telegram',
  Zapier = 'zapier',
  Unknown = 'unknown',
}

export interface ForumWebhookData {
  communityId: string;
  // title of the webhook data notification
  // (usually an action combined with the title of the object)
  // e.g. "New comment on: <thread title>"
  titlePrefix: string;
  previewImageUrl: string;
  previewImageAltText: string;

  profileName: string;
  profileUrl: string;
  profileAvatarUrl: string;

  objectTitle: string;
  objectUrl: string;
  objectSummary: string;
}

export interface ChainEventWebhookData {
  title: string;
  description: string;
  url: string;
  previewImageUrl: string;
  previewImageAltText: string;
}

export type WebhookDataByCategory<C extends NotificationCategories> =
  C extends NotificationCategories.ChainEvent
    ? ChainEventWebhookData
    : ForumWebhookData;
