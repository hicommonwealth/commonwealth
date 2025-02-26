import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import { CommentsFeaturedFilterTypes } from 'models/types';
import type { DeltaStatic } from 'quill';
import React from 'react';
import { StreamingReplyData } from 'views/components/Comments/CommentEditor/CommentEditor';
import Thread from '../../../../models/Thread';
import { CommentViewParams } from '../CommentCard/CommentCard';
import './CommentTree.scss';

export type CommentsTreeProps = {
  pageRef: React.MutableRefObject<HTMLDivElement | null>;
  commentsRef: React.MutableRefObject<HTMLDivElement | null>;
  thread: Thread;
  setIsGloballyEditing?: (status: boolean) => void;
  fromDiscordBot?: boolean;
  canReact?: boolean;
  canReply?: boolean;
  canComment: boolean;
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
  onThreadCreated?: (threadId: number) => Promise<void>;
  aiCommentsToggleEnabled?: boolean;
  streamingReplyIds: Array<number | StreamingReplyData>;
  setStreamingReplyIds: React.Dispatch<
    React.SetStateAction<Array<number | StreamingReplyData>>
  >;
};

export type UseCommentsTreeProps = Pick<
  CommentsTreeProps,
  'thread' | 'setIsGloballyEditing'
>;

export type CommentFilters = {
  includeSpam: boolean;
  sortType: CommentsFeaturedFilterTypes;
};

export type CommentFiltersProps = Pick<CommentsTreeProps, 'commentsRef'> & {
  filters: CommentFilters;
  onFiltersChange: (newFilters: CommentFilters) => void;
};

export type TreeHierarchyProps = Pick<
  CommentsTreeProps,
  | 'pageRef'
  | 'thread'
  | 'disabledActionsTooltipText'
  | 'streamingReplyIds'
  | 'setStreamingReplyIds'
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
