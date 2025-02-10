import { useFlag } from 'hooks/useFlag';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CommentEditor, {
  CommentEditorProps,
} from 'views/components/Comments/CommentEditor/CommentEditor';
import { MobileInput } from 'views/components/StickEditorContainer/MobileInput';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import './MobileStickyInput.scss';

/**
 * This mobile version uses a portal to add itself to the bottom nav.
 */
export const MobileStickyInput = (props: CommentEditorProps) => {
  const { handleSubmitComment, replyingToAuthor } = props;
  const [focused, setFocused] = useState(false);
  const aiCommentsEnabled = useFlag('aiComments');
  const [useAiStreaming, setUseAiStreaming] = useState(aiCommentsEnabled);
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);

  useEffect(() => {
    console.log('MobileStickyInput State:', {
      focused,
      useAiStreaming,
      replyingToAuthor,
      parentExists: !!document.getElementById('MobileNavigationHead'),
      timestamp: new Date().toISOString(),
      streamingReplyIds,
    });
  }, [focused, useAiStreaming, replyingToAuthor, streamingReplyIds]);

  const handleAiReply = useCallback(
    (commentId: number) => {
      console.log('MobileStickyInput - Starting AI reply for:', commentId);
      if (streamingReplyIds.includes(commentId)) {
        console.log('Already streaming for this comment');
        return;
      }
      setStreamingReplyIds((prev) => [...prev, commentId]);
    },
    [streamingReplyIds],
  );

  const customHandleSubmitComment = useCallback(async (): Promise<number> => {
    setFocused(false);
    const commentId = await handleSubmitComment();

    if (typeof commentId !== 'number' || isNaN(commentId)) {
      console.error('MobileStickyInput - Invalid comment ID:', commentId);
      throw new Error('Invalid comment ID');
    }

    // If AI mode is enabled, trigger the streaming reply
    if (useAiStreaming) {
      handleAiReply(commentId);
    }

    // Directly trigger jump highlighting after a short delay to allow the comment to render
    setTimeout(() => {
      const element = document.querySelector(`.comment-${commentId}`);
      console.log(
        `MobileStickyInput - Checking for comment element with selector .comment-${commentId}:`,
        element,
      );
      if (element) {
        console.log(
          `MobileStickyInput - Element found for comment ID ${commentId}`,
        );
      } else {
        console.warn(
          `MobileStickyInput - No element found for comment ID ${commentId} at timeout`,
        );
      }
      console.log(
        `MobileStickyInput - Scrolling and highlighting comment ID: ${commentId}`,
      );
      jumpHighlightComment(commentId);
    }, 300);

    return commentId;
  }, [handleSubmitComment, useAiStreaming, handleAiReply]);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFocused(false);
  }, []);

  const parent = document.getElementById('MobileNavigationHead');

  if (!parent) {
    console.warn('No parent container for MobileStickyInput');
    return null;
  }

  if (focused) {
    return (
      <div className="MobileStickyInputFocused">
        <CommentEditor
          {...props}
          shouldFocus={true}
          onCancel={handleCancel}
          useAiStreaming={useAiStreaming}
          setUseAiStreaming={setUseAiStreaming}
          handleSubmitComment={customHandleSubmitComment}
          onAiReply={handleAiReply}
          streamingReplyIds={streamingReplyIds}
        />
      </div>
    );
  }

  return createPortal(
    <div className="MobileStickyInput">
      <MobileInput
        {...props}
        onFocus={handleFocused}
        useAiStreaming={useAiStreaming}
        setUseAiStreaming={setUseAiStreaming}
      />
    </div>,
    parent,
  );
};
