import { ISnapshotNotificationData } from './proposal';
import { SupportedNetwork } from './protocol';

export enum NotificationCategories {
  NewComment = 'new-comment-creation',
  NewThread = 'new-thread-creation',
  NewMention = 'new-mention',
  NewReaction = 'new-reaction',
  NewCollaboration = 'new-collaboration',
  ThreadEdit = 'thread-edit',
  CommentEdit = 'comment-edit',
  ChainEvent = 'chain-event',
  SnapshotProposal = 'snapshot-proposal',
}

export type WebhookCategory =
  | NotificationCategories.ChainEvent
  | NotificationCategories.NewThread
  | NotificationCategories.NewComment
  | NotificationCategories.NewReaction;

export type NotificationCategory =
  typeof NotificationCategories[keyof typeof NotificationCategories];

// TODO: @Timothee remove this type in favor of the one below once webhook and email functions are fixed + tested and
//  their types are updated
export interface IForumNotificationData {
  created_at: any;
  thread_id: number | string;
  root_title: string;
  root_type: string;
  community_id: string;
  author_address: string;
  author_community_id: string;
  comment_id?: number;
  comment_text?: string;
  parent_comment_id?: number;
  parent_comment_text?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

// export type IForumNotificationData =
//   | INewCommentNotificationData
//   | INewReactionNotificationData
//   | INewThreadNotificationData
//   | INewMentionNotificationData
//   | INewCollaborationNotificationData
//   | IThreadEditNotificationData
//   | ICommentEditNotificationData;

export interface IBaseForumNotificationData {
  created_at: any;
  thread_id: number | string;
  root_title: string;
  root_type: string;
  community_id: string;
  author_address: string;
  author_community_id: string;
}

export interface INewCommentNotificationData
  extends IBaseForumNotificationData {
  comment_id: number;
  comment_text: string;
  parent_comment_id?: number;
  parent_comment_text?: string;
}

export interface INewReactionNotificationData
  extends IBaseForumNotificationData {
  comment_id?: number;
  comment_text?: string;
}

export interface INewThreadNotificationData extends IBaseForumNotificationData {
  comment_text: string;
}

export interface INewMentionNotificationData
  extends IBaseForumNotificationData {
  mentioned_user_id: number;
  comment_id?: number;
  comment_text: string;
}

export interface INewCollaborationNotificationData
  extends IBaseForumNotificationData {
  comment_text: string;
  collaborator_user_id: number;
}

export interface IThreadEditNotificationData
  extends IBaseForumNotificationData {}

export interface ICommentEditNotificationData
  extends IBaseForumNotificationData {
  comment_id: number;
  comment_text: string;
}

type ChainEventAttributes = {
  id: number;
  block_number: number;
  event_data: any;
  queued: number;
  entity_id?: number;
  network: SupportedNetwork;
  chain: string;
  created_at?: Date;
  updated_at?: Date;
};

export type ChainEventNotification = {
  id: number;
  notification_data: string;
  chain_event_id: number;
  category_id: 'chain-event';
  chain_id: string;
  updated_at: Date;
  created_at: Date;
  ChainEvent: ChainEventAttributes;
};

export interface IChainEventNotificationData {
  id?: number;
  block_number?: number;
  event_data: any;
  network: SupportedNetwork;
  community_id: string;
}

export interface ISnapshotNotification {
  id?: string;
  title?: string;
  body?: string;
  choices?: string[];
  space?: string;
  event?: string;
  start?: string;
  expire?: string;
}

export type NotificationDataTypes =
  | IForumNotificationData
  | IChainEventNotificationData
  | ISnapshotNotificationData;

export type NotifCategoryToNotifDataMapping = {
  [K in NotificationCategory]: K extends typeof NotificationCategories.NewComment
    ? INewCommentNotificationData
    : K extends typeof NotificationCategories.NewThread
    ? INewThreadNotificationData
    : K extends typeof NotificationCategories.NewMention
    ? INewMentionNotificationData
    : K extends typeof NotificationCategories.NewReaction
    ? INewReactionNotificationData
    : K extends typeof NotificationCategories.NewCollaboration
    ? INewCollaborationNotificationData
    : K extends typeof NotificationCategories.ThreadEdit
    ? IThreadEditNotificationData
    : K extends typeof NotificationCategories.CommentEdit
    ? ICommentEditNotificationData
    : K extends typeof NotificationCategories.ChainEvent
    ? IChainEventNotificationData
    : K extends typeof NotificationCategories.SnapshotProposal
    ? ISnapshotNotificationData
    : never;
};

// This maps a NotificationCategory to a NotificationDataType - if the category and the
// data don't match a type error will be raised. Very useful for ensuring that the correct
// data is provided for a given NotificationCategory.
export type NotificationDataAndCategory = {
  [K in NotificationCategory]: {
    categoryId: K;
    data: NotifCategoryToNotifDataMapping[K];
  };
}[NotificationCategory];

export type EmitNotification<T> = (
  models: unknown,
  notification_data_and_category: NotificationDataAndCategory,
  excludeAddresses?: string[],
  includeAddresses?: string[],
) => Promise<T>;
