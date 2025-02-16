import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocalAISettingsStore } from 'state/ui/user';
import useSidebarStore from 'state/ui/sidebar/sidebar';
import CommentEditor, {
  CommentEditorProps,
} from 'views/components/Comments/CommentEditor/CommentEditor';
import { MobileInput } from 'views/components/StickEditorContainer/MobileInput';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import './MobileStickyInput.scss';

/**
 * This mobile version uses a portal to add itself to the bottom nav.
 */
export const MobileStickyInput = (props: CommentEditorProps) => {
  const { handleSubmitComment } = props;
  const [focused, setFocused] = useState(false);
  const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
    useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const menuVisible = useSidebarStore((state) => state.menuVisible);

  const handleAiReply = useCallback(
    (commentId: number) => {
      if (streamingReplyIds.includes(commentId)) {
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
    if (aiCommentsToggleEnabled) {
      handleAiReply(commentId);
    }

    // Use the new listenForComment function
    try {
      await listenForComment(commentId, aiCommentsToggleEnabled);
    } catch (error) {
      console.warn('MobileStickyInput - Failed to jump to comment:', error);
    }

    return commentId;
  }, [handleSubmitComment, aiCommentsToggleEnabled, handleAiReply]);

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

  // Don't render anything if the sidebar is open
  if (menuVisible) {
    return null;
  }

  if (focused) {
    return (
      <div className="MobileStickyInputFocused">
        <CommentEditor
          {...props}
          shouldFocus={true}
          onCancel={handleCancel}
          aiCommentsToggleEnabled={aiCommentsToggleEnabled}
          setAICommentsToggleEnabled={setAICommentsToggleEnabled}
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
        aiCommentsToggleEnabled={aiCommentsToggleEnabled}
        setAICommentsToggleEnabled={setAICommentsToggleEnabled}
      />
    </div>,
    parent,
  );
};
