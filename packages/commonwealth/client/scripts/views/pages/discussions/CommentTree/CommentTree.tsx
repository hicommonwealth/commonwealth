import React, { useEffect, useState } from 'react';
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
  streamingReplyIds,
  setStreamingReplyIds,
}: CommentsTreeProps) => {
  const user = useUserStore();
  const [hasTriggeredAIComment, setHasTriggeredAIComment] = useState(false);

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
    const shouldGenerateAIComment =
      thread &&
      aiCommentsToggleEnabled &&
      onThreadCreated &&
      (!thread.numberOfComments || thread.numberOfComments === 0) &&
      !hasTriggeredAIComment &&
      streamingReplyIds.length === 0;

    if (shouldGenerateAIComment) {
      setHasTriggeredAIComment(true);
      onThreadCreated(thread.id).catch(() => {
        setHasTriggeredAIComment(false); // Reset if there was an error
      });
    }
  }, [
    thread?.id,
    thread?.numberOfComments,
    aiCommentsToggleEnabled,
    onThreadCreated,
    user.activeAccount,
    hasTriggeredAIComment,
    streamingReplyIds,
  ]);

  // Reset trigger state if thread changes or comments are added
  useEffect(() => {
    if (thread?.numberOfComments > 0) {
      setHasTriggeredAIComment(false);
    }
  }, [thread?.id, thread?.numberOfComments]);

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
        pageRef={pageRef}
        thread={thread}
        isThreadLocked={!!thread.lockedAt}
        isThreadArchived={!!thread.archivedAt}
        isReplyingToCommentId={parentCommentId}
        isReplyButtonVisible={
          !!(!isLocked && !fromDiscordBot && user.isLoggedIn)
        }
        onDelete={handleDeleteComment}
        onEditStart={handleEditStart}
        onEditConfirm={handleEditConfirm}
        onEditCancel={handleEditCancel}
        onSpamToggle={handleFlagMarkAsSpam}
        onCommentReplyStart={handleCommentReplyStart}
        onCommentReplyEnd={handleIsReplying}
        commentEdits={edits}
        canComment={canComment}
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
        commentFilters={commentFilters}
        streamingReplyIds={streamingReplyIds}
        setStreamingReplyIds={setStreamingReplyIds}
      />
    </>
  );
};
