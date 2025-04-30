import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalAISettingsStore } from 'state/ui/user';
import CommentEditor, {
  CommentEditorProps,
} from 'views/components/Comments/CommentEditor/CommentEditor';
import {
  NewThreadForm,
  NewThreadFormHandles,
} from 'views/components/NewThreadFormLegacy/NewThreadForm';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import './DesktopStickyInput.scss';
import { useStickComment } from './context/StickCommentProvider';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const { isReplying, replyingToAuthor, onCancel, handleSubmitComment } = props;
  const { mode, isExpanded, setIsExpanded } = useStickComment();
  const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
    useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const [openModalOnExpand, setOpenModalOnExpand] = useState(false);
  const commentEditorRef = useRef<any>(null);
  const newThreadFormRef = useRef<NewThreadFormHandles>(null);

  const handleFocused = useCallback(() => {
    setIsExpanded(true);
  }, [setIsExpanded]);

  const handleCancel = useCallback(
    (event: React.MouseEvent | undefined) => {
      setIsExpanded(false);
      setOpenModalOnExpand(false);
      onCancel?.(event);
    },
    [onCancel, setIsExpanded],
  );

  useEffect(() => {
    if (isExpanded && openModalOnExpand && mode === 'thread') {
      newThreadFormRef.current?.openImageModal();
      setOpenModalOnExpand(false);
    }
  }, [isExpanded, openModalOnExpand, mode]);

  const handleAiReply = useCallback(
    (commentId: number) => {
      if (streamingReplyIds.includes(commentId)) {
        return;
      }
      setStreamingReplyIds((prev) => [...prev, commentId]);
    },
    [streamingReplyIds],
  );

  const handleEnhancedSubmit = useCallback(
    async (turnstileToken?: string | null): Promise<number> => {
      setIsExpanded(false);

      const commentId = await handleSubmitComment(turnstileToken);

      if (typeof commentId !== 'number' || isNaN(commentId)) {
        console.error('DesktopStickyInput - Invalid comment ID:', commentId);
        throw new Error('Invalid comment ID');
      }

      if (aiCommentsToggleEnabled) {
        handleAiReply(commentId);
      }

      const attemptJump = () => {
        const commentElement = document.querySelector(`.comment-${commentId}`);
        if (commentElement) {
          jumpHighlightComment(commentId);
          return true;
        }
        return false;
      };

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
    },
    [
      handleSubmitComment,
      aiCommentsToggleEnabled,
      handleAiReply,
      setIsExpanded,
    ],
  );

  const useExpandedEditor = isExpanded || isReplying;

  const editorProps: CommentEditorProps & { ref?: React.Ref<any> } = {
    ...props,
    ref: commentEditorRef,
    shouldFocus: true,
    onCancel: handleCancel,
    aiCommentsToggleEnabled,
    handleSubmitComment: handleEnhancedSubmit,
    onAiReply: handleAiReply,
    streamingReplyIds,
    onCommentCreated: (commentId: number, hasAI: boolean) => {
      if (hasAI) {
        handleAiReply(commentId);
      }
    },
  };

  const newThreadFormProps = {
    ref: newThreadFormRef,
    onCancel: handleCancel,
  };

  return (
    <div className="DesktopStickyInput">
      {!useExpandedEditor ? (
        <div className="DesktopStickyInputCollapsed">
          <div className="container" onClick={handleFocused}>
            <input
              type="text"
              className="form-control"
              placeholder={
                mode === 'thread'
                  ? 'Create a thread...'
                  : replyingToAuthor
                    ? `Reply to ${replyingToAuthor}...`
                    : 'Write a comment...'
              }
              readOnly
            />
            <CWTooltip
              content="Add or Generate Image"
              placement="top"
              renderTrigger={(handleInteraction, isOpen) => (
                <CWIconButton
                  iconName="image"
                  buttonSize="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode === 'thread') {
                      setOpenModalOnExpand(true);
                      handleFocused();
                    }
                  }}
                  aria-label="Add or Generate Image"
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                  data-tooltip-open={isOpen}
                  className="collapsed-image-button"
                />
              )}
            />
          </div>
        </div>
      ) : (
        <div className="DesktopStickyInputExpanded">
          {mode === 'thread' ? (
            <NewThreadForm {...newThreadFormProps} />
          ) : (
            <CommentEditor {...editorProps} />
          )}
        </div>
      )}
    </div>
  );
};
