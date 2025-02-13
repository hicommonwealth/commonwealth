import React, { useCallback, useState } from 'react';
import { useLocalAISettingsStore } from 'state/ui/user';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import './DesktopStickyInput.scss';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const { isReplying, replyingToAuthor, onCancel, handleSubmitComment } = props;
  const [focused, setFocused] = useState(false);
  const {
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
    aiCommentsFeatureEnabled,
  } = useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const handleCancel = useCallback(
    (event: React.MouseEvent) => {
      setFocused(false);
      onCancel(event);
    },
    [onCancel],
  );

  const handleAiToggle = useCallback(() => {
    setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
  }, [aiCommentsToggleEnabled, setAICommentsToggleEnabled]);

  const handleAiReply = useCallback(
    (commentId: number) => {
      console.log('DesktopStickyInput - Starting AI reply for:', commentId);
      if (streamingReplyIds.includes(commentId)) {
        console.log('Already streaming for this comment');
        return;
      }
      setStreamingReplyIds((prev) => [...prev, commentId]);
    },
    [streamingReplyIds],
  );

  const handleEnhancedSubmit = useCallback(async () => {
    console.log(
      'DesktopStickyInput - Submitting comment with AI mode:',
      aiCommentsToggleEnabled,
    );

    // Post the comment and get its ID
    const commentId = await handleSubmitComment();

    if (typeof commentId !== 'number' || isNaN(commentId)) {
      console.error('DesktopStickyInput - Invalid comment ID:', commentId);
      throw new Error('Invalid comment ID');
    }

    // If AI mode is enabled, trigger the streaming reply
    if (aiCommentsToggleEnabled) {
      handleAiReply(commentId);
    }

    const attemptJump = () => {
      const commentElement = document.querySelector(`.comment-${commentId}`);
      if (commentElement) {
        console.log(
          `DesktopStickyInput - Found comment element for ID ${commentId}, scrolling...`,
        );
        jumpHighlightComment(commentId);
        return true;
      }
      return false;
    };

    // Attempt jump after delays to allow the DOM to update
    await new Promise((resolve) => setTimeout(resolve, 500));
    attemptJump();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    attemptJump();

    setTimeout(() => {
      if (!attemptJump()) {
        console.error(
          `DesktopStickyInput - Comment element for ID ${commentId} not found in DOM after all attempts`,
        );
      }
    }, 2000);

    return commentId;
  }, [handleSubmitComment, aiCommentsToggleEnabled, handleAiReply]);

  const useExpandedEditor = focused || isReplying;

  // Create a new props object with our local state
  const editorProps = {
    ...props,
    shouldFocus: true,
    onCancel: handleCancel,
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
    handleSubmitComment: handleEnhancedSubmit,
    onAiReply: handleAiReply,
    streamingReplyIds,
  };

  return (
    <div className="DesktopStickyInput">
      {!useExpandedEditor ? (
        <div className="DesktopStickyInputCollapsed">
          <div className="container">
            <input
              type="text"
              className="form-control"
              placeholder={
                replyingToAuthor
                  ? `Reply to ${replyingToAuthor}...`
                  : 'Write a comment...'
              }
              onClick={handleFocused}
            />
            {aiCommentsFeatureEnabled && (
              <div className="ai-comments-toggle-container">
                <CWToggle
                  className="ai-toggle"
                  checked={aiCommentsToggleEnabled}
                  onChange={handleAiToggle}
                  icon="sparkle"
                  size="xs"
                  iconColor="#757575"
                />
                <span className="label">AI</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="DesktopStickyInputExpanded">
          <CommentEditor {...editorProps} />
        </div>
      )}
    </div>
  );
};
