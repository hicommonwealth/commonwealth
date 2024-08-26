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

export type NotificationCategory =
  (typeof NotificationCategories)[keyof typeof NotificationCategories];

// TODO: @Timothee remove this type in favor of the one below once webhook and email functions are fixed + tested and
//  their types are updated
export interface IForumNotificationData {
  created_at: Date;
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
