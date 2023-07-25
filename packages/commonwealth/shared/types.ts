import type { ChainEventAttributes } from 'chain-events/services/database/models/chain_event';
import type { SnapshotProposalAttributes } from '../server/models/snapshot_proposal';
import type { AccessLevel } from './permissions';
import {
  NotificationCategories,
  NotificationCategory,
} from 'common-common/src/types';

export enum WebsocketMessageNames {
  ChainEventNotification = 'chain-event-notification',
  SnapshotProposalNotification = 'snapshot-proposal-notification',
  SnapshotListener = 'snapshot-listener',
  NewSubscriptions = 'new-subscriptions',
  DeleteSubscriptions = 'delete-subscriptions',
  Error = 'exception',
}

export type SnapshotProposalNotification = {
  id: string;
  category_id: 'snapshot-proposal';
  chain_id: string;
  SnapshotProposal: SnapshotProposalAttributes;
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

export const enum SnapshotEventType {
  Created = 'proposal/created',
  Deleted = 'proposal/deleted',
  Ended = 'proposal/end',
  Started = 'proposal/start',
}

export enum WebsocketNamespaces {
  SnapshotProposals = 'snapshot-proposals',
  ChainEvents = 'chain-events',
  SnapshotListener = 'snapshot-listener',
}

export enum WebsocketEngineEvents {
  CreateRoom = 'create-room',
  DeleteRoom = 'delete-room',
}

export interface ISnapshotNotificationData {
  id?: string;
  title?: string;
  body?: string;
  choices?: string[];
  space?: string;
  event?: string;
  start?: string;
  expire?: string;
  eventType: SnapshotEventType;
}

export interface IForumNotificationData {
  created_at: any;
  thread_id: number | string;
  root_title: string;
  root_type: string;
  chain_id: string;
  author_address: string;
  author_chain: string;
  comment_id?: number;
  comment_text?: string;
  parent_comment_id?: number;
  parent_comment_text?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

export interface IChainEventNotificationData extends ChainEventAttributes {}

export type NotificationDataTypes =
  | IForumNotificationData
  | IChainEventNotificationData
  | ISnapshotNotificationData;

export type NotifCategoryToNotifDataMapping = {
  [K in NotificationCategory]: K extends typeof NotificationCategories.NewComment
    ? IForumNotificationData
    : K extends typeof NotificationCategories.NewThread
    ? IForumNotificationData
    : K extends typeof NotificationCategories.NewMention
    ? IForumNotificationData
    : K extends typeof NotificationCategories.NewReaction
    ? IForumNotificationData
    : K extends typeof NotificationCategories.NewCollaboration
    ? IForumNotificationData
    : K extends typeof NotificationCategories.ThreadEdit
    ? IForumNotificationData
    : K extends typeof NotificationCategories.CommentEdit
    ? IForumNotificationData
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
    category: K;
    data: NotifCategoryToNotifDataMapping[K];
  };
}[NotificationCategory];

export enum ContentType {
  Thread = 'thread',
  Comment = 'comment',
  // Proposal = 'proposal',
}

export enum SearchContentType {
  Thread = 'thread',
  Comment = 'comment',
  Chain = 'chain',
  Token = 'token',
  Member = 'member',
}

export const DynamicTemplate = {
  ImmediateEmailNotification: 'd-3f30558a95664528a2427b40292fec51',
  BatchNotifications: 'd-468624f3c2d7434c86ae0ed0e1d2227e',
  SignIn: 'd-db52815b5f8647549d1fe6aa703d7274',
  SignUp: 'd-2b00abbf123e4b5981784d17151e86be',
  UpdateEmail: 'd-a0c28546fecc49fb80a3ba9e535bff48',
  VerifyAddress: 'd-292c161f1aec4d0e98a0bf8d6d8e42c2',
  EmailDigest: 'd-a4f27421ce5a41d29dca7625d2136cc3',
};

export type RoleObject = {
  permission: AccessLevel;
  allow: number;
  deny: number;
};
