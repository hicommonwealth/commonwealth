import React, { useCallback, useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { trpc } from 'utils/trpcClient';
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
  onThreadCreated,
  aiCommentsToggleEnabled,
  streamingInstances,
  setStreamingInstances,
  permissions,
  onChatModeChange,
}: CommentsTreeProps) => {
  const user = useUserStore();
  const [hasTriggeredAIComment, setHasTriggeredAIComment] = useState(false);
  const utils = trpc.useUtils();

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
      streamingInstances.length === 0;

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
    streamingInstances,
    thread,
  ]);

  // Reset trigger state if thread changes or comments are added
  useEffect(() => {
    if (thread?.numberOfComments > 0) {
      setHasTriggeredAIComment(false);
    }
  }, [thread?.id, thread?.numberOfComments]);

  const handleFiltersChange = useCallback(
    (newFilters: typeof commentFilters) => {
      void (async () => {
        // Check if sort type is changing (which affects pagination and ordering)
        if (newFilters.sortType !== commentFilters.sortType) {
          await utils.comment.getComments.reset({
            thread_id: thread.id,
          });
        }
      })();

      onFiltersChange(newFilters);
      onChatModeChange?.(newFilters.sortType === 'oldest');
    },
    [commentFilters, onFiltersChange, onChatModeChange, utils, thread.id],
  );

  return (
    <>
      {thread?.numberOfComments > 0 && (
        <CommentFilters
          commentsRef={commentsRef}
          filters={commentFilters}
          onFiltersChange={handleFiltersChange}
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
        permissions={permissions}
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
        streamingInstances={streamingInstances}
        setStreamingInstances={setStreamingInstances}
      />
    </>
  );
};
