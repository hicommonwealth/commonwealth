import { GatedActionEnum } from '@hicommonwealth/shared';
import { CommentsFeaturedFilterTypes } from 'models/types';
import type { DeltaStatic } from 'quill';
import React from 'react';
import Permissions from 'utils/Permissions';
import Thread from '../../../../models/Thread';
import { CommentViewParams } from '../CommentCard/CommentCard';
import './CommentTree.scss';
import { StreamingReplyInstance } from './TreeHierarchy';

const actionPermissions = [
  GatedActionEnum.CREATE_COMMENT,
  GatedActionEnum.CREATE_COMMENT_REACTION,
] as const;

export type CommentsTreeProps = {
  pageRef: React.MutableRefObject<HTMLDivElement | null>;
  commentsRef: React.MutableRefObject<HTMLDivElement | null>;
  thread: Thread;
  setIsGloballyEditing?: (status: boolean) => void;
  fromDiscordBot?: boolean;
  canReact?: boolean;
  canReply?: boolean;
  canComment: boolean;
  onThreadCreated?: (threadId: number) => Promise<void>;
  aiCommentsToggleEnabled?: boolean;
  streamingInstances: StreamingReplyInstance[];
  setStreamingInstances: (
    instances:
      | StreamingReplyInstance[]
      | ((prevInstances: StreamingReplyInstance[]) => StreamingReplyInstance[]),
  ) => void;
  permissions: ReturnType<
    typeof Permissions.getMultipleActionsPermission<typeof actionPermissions>
  >;
};

export type UseCommentsTreeProps = Pick<
  CommentsTreeProps,
  'thread' | 'setIsGloballyEditing'
>;

export type CommentFilters = {
  includeSpam: boolean;
  sortType: CommentsFeaturedFilterTypes;
  permissions: any;
  aiCommentsToggleEnabled?: boolean;
  onThreadCreated?: (threadId: number) => Promise<void>;
};

export type CommentFiltersProps = Pick<CommentsTreeProps, 'commentsRef'> & {
  filters: CommentFilters;
  onFiltersChange: (newFilters: CommentFilters) => void;
};

export type TreeHierarchyProps = Pick<
  CommentsTreeProps,
  'pageRef' | 'thread' | 'permissions'
> & {
  parentCommentId?: number;
  isThreadLocked: boolean;
  isThreadArchived: boolean;
  isReplyingToCommentId?: number;
  isReplyButtonVisible: boolean;
  canReply: boolean;
  canReact: boolean;
  canComment: boolean;
  onEditStart: (comment: CommentViewParams) => void;
  onEditConfirm: (comment: CommentViewParams, newDelta: DeltaStatic) => void;
  onEditCancel: (
    comment: CommentViewParams,
    hasContentChanged: boolean,
  ) => void;
  onDelete: (comment: CommentViewParams) => void;
  onSpamToggle: (comment: CommentViewParams) => void;
  onCommentReplyStart: (commentId: number, commentIndex: number) => void;
  onCommentReplyEnd: (isReplying: boolean, id?: number) => void;
  commentFilters: CommentFilters;
  commentEdits?: {
    [commentId: number]: {
      isEditing?: boolean;
      editDraft?: string;
      isSavingEdit?: boolean;
      contentDelta?: string | DeltaStatic;
    };
  };
};
