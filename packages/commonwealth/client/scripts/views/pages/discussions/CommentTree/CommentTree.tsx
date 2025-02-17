import React, { useEffect } from 'react';
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
  canReact = true,
  canReply = true,
  canComment,
  disabledActionsTooltipText,
  onThreadCreated,
  aiCommentsToggleEnabled,
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
    handleCommentReplyStart,
    isLocked,
    parentCommentId,
    onFiltersChange,
    isAdmin,
  } = useCommentTree({
    thread,
    setIsGloballyEditing,
  });

  useEffect(() => {
    if (thread && aiCommentsToggleEnabled && onThreadCreated) {
      onThreadCreated(thread.id).catch(console.error);
    }
  }, [thread?.id, aiCommentsToggleEnabled, onThreadCreated]);

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
        isReplyingToCommentId={parentCommentId}
        onCommentReplyStart={handleCommentReplyStart}
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
