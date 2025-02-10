import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import CommentEditor, {
  CommentEditorProps,
} from 'views/components/Comments/CommentEditor/CommentEditor';
import { MobileInput } from 'views/components/StickEditorContainer/MobileInput';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import { useAiToggleState } from '../../../hooks/useAiToggleState';
import './MobileStickyInput.scss';

/**
 * This mobile version uses a portal to add itself to the bottom nav.
 */
export const MobileStickyInput = (props: CommentEditorProps) => {
  const { handleSubmitComment } = props;
  const [focused, setFocused] = useState(false);
  const { useAiStreaming, setUseAiStreaming } = useAiToggleState();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);

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
    if (useAiStreaming === true) {
      console.log(
        'MobileStickyInput - AI streaming is enabled, triggering reply',
      );
      handleAiReply(commentId);
    } else {
      console.log(
        'MobileStickyInput - AI streaming is disabled, skipping AI reply',
      );
    }

    // Use the new listenForComment function
    try {
      await listenForComment(commentId, useAiStreaming === true);
      console.log(
        'MobileStickyInput - Successfully jumped to comment:',
        commentId,
      );
    } catch (error) {
      console.warn('MobileStickyInput - Failed to jump to comment:', error);
    }

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
