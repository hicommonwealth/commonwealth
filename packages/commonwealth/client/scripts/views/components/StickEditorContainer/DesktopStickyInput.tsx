import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { useGenerateCommentText } from 'views/components/Comments/useGenerateCommentText';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import './DesktopStickyInput.scss';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const {
    isReplying,
    replyingToAuthor,
    onCancel,
    handleSubmitComment,
    onAiReply,
  } = props;
  const [focused, setFocused] = useState(false);
  const [useAiStreaming, setUseAiStreaming] = useState(false);
  const { generateComment } = useGenerateCommentText();

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
    console.log(
      'DesktopStickyInput - Toggling AI mode from:',
      useAiStreaming,
      'to:',
      !useAiStreaming,
    );
    setUseAiStreaming((prev) => !prev);
  }, [useAiStreaming]);

  const handleEnhancedSubmit = useCallback(async () => {
    console.log(
      'DesktopStickyInput - Submitting comment with AI mode:',
      useAiStreaming,
    );

    // Post the comment and get its ID
    const commentId = await handleSubmitComment();

    if (typeof commentId !== 'number' || isNaN(commentId)) {
      console.error('DesktopStickyInput - Invalid comment ID:', commentId);
      throw new Error('Invalid comment ID');
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

    // If AI mode is enabled, generate an AI reply
    if (useAiStreaming && onAiReply) {
      try {
        const aiReply = await generateComment(
          'Generate an AI reply for the comment.',
        );
        onAiReply(aiReply);
      } catch (error) {
        console.error('DesktopStickyInput - AI generation failed:', error);
      }
    }

    return commentId;
  }, [handleSubmitComment, useAiStreaming, onAiReply, generateComment]);

  const useExpandedEditor = focused || isReplying;

  return (
    <div className="DesktopStickyInput">
      {!useExpandedEditor ? (
        <div className="DesktopStickyInputCollapsed">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #E5E5E5',
              cursor: 'text',
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder={
                replyingToAuthor
                  ? `Reply to ${replyingToAuthor}...`
                  : 'Write a comment...'
              }
              onClick={handleFocused}
              style={{
                width: '100%',
                border: 'none',
                padding: '0',
                background: 'transparent',
                outline: 'none',
              }}
            />
            <div
              style={{
                marginLeft: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CWToggle
                checked={useAiStreaming}
                onChange={handleAiToggle}
                icon="sparkle"
                size="xs"
                iconColor="#757575"
              />
              <span style={{ fontSize: '12px', color: '#757575' }}>AI</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="DesktopStickyInputExpanded">
          <CommentEditor
            {...props}
            shouldFocus={true}
            onCancel={handleCancel}
            useAiStreaming={useAiStreaming}
            setUseAiStreaming={setUseAiStreaming}
            handleSubmitComment={handleEnhancedSubmit}
          />
        </div>
      )}
    </div>
  );
};
