import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import { CommentsFeaturedFilterTypes } from 'models/types';
import React from 'react';
import Thread from '../../../../models/Thread';
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
