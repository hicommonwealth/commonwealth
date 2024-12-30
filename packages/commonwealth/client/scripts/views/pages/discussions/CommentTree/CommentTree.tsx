import React from 'react';
import useUserStore from 'state/ui/user';
import { CommentFilters } from './CommentFilters';
import './CommentTree.scss';
import { TreeHierarchy } from './TreeHierarchy';
import { CommentsTreeProps } from './types';
import { useCommentTree } from './useCommentTree';

export const CommentTree = ({
  pageRef,
  commentsRef,
  thread,
  setIsGloballyEditing,
  fromDiscordBot,
  // isReplying, TODO: fix this flag
  setIsReplying,
  parentCommentId,
  setParentCommentId,
  canReact = true,
  canReply = true,
  canComment,
  disabledActionsTooltipText,
}: CommentsTreeProps) => {
  const user = useUserStore();

  const {
    commentFilters,
    edits,
    handleDeleteComment,
    handleEditCancel,
    handleEditConfirm,
    handleEditStart,
    handleFlagMarkAsSpam,
    handleIsReplying,
    handleScrollToComment,
    isLocked,
    onFiltersChange,
    isAdmin,
  } = useCommentTree({
    thread,
    setIsGloballyEditing,
    setIsReplying,
    setParentCommentId,
  });

  return (
    <>
      {thread?.numberOfComments > 0 && (
        <CommentFilters
          commentsRef={commentsRef}
          filters={commentFilters}
          onFiltersChange={onFiltersChange}
        />
      )}
      <TreeHierarchy
        commentFilters={commentFilters}
        isThreadArchived={!!thread.archivedAt}
        isThreadLocked={isLocked}
        isReplyButtonVisible={
          !!(!isLocked && !fromDiscordBot && user.isLoggedIn)
        }
        onDelete={handleDeleteComment}
        onEditStart={handleEditStart}
        onEditConfirm={handleEditConfirm}
        onEditCancel={handleEditCancel}
        onSpamToggle={handleFlagMarkAsSpam}
        pageRef={pageRef}
        isReplying={{
          parentCommentId,
          toComment: 1, // todo: this should refer to the comment that is supposed to get a reply.
        }}
        onCommentReplyStart={(commentId, index) => {
          setParentCommentId(commentId);
          setIsReplying(true);
          handleScrollToComment(index);
        }}
        onCommentReplyEnd={handleIsReplying}
        commentEdits={edits}
        canComment={canComment}
        thread={thread}
        disabledActionsTooltipText={disabledActionsTooltipText}
        canReact={
          !thread.archivedAt && (!!user.activeAccount || isAdmin) && canReact
        }
        canReply={
          !!user.activeAccount &&
          !thread.archivedAt &&
          !thread.lockedAt &&
          canReply
        }
      />
    </>
  );
};
