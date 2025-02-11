import { ContentType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { notifyError } from 'controllers/app/notifications';
import { useGenerateCommentText } from 'hooks/useGenerateCommentText';
import Account from 'models/Account';
import type { DeltaStatic } from 'quill';
import React, { useCallback, useState } from 'react';
import { User } from 'views/components/user/user';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import { isCommandClick } from '../../../../helpers';
import { useAiToggleState } from '../../../../hooks/useAiToggleState';
import { CWText } from '../../component_kit/cw_text';
import { CWValidationText } from '../../component_kit/cw_validation_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import { CWThreadAction } from '../../component_kit/new_designs/cw_thread_action';
import { CWToggle } from '../../component_kit/new_designs/cw_toggle';
import { ReactQuillEditor } from '../../react_quill_editor';
import './CommentEditor.scss';

export type CommentEditorProps = {
  parentType: ContentType;
  canComment: boolean;
  handleSubmitComment: () => Promise<number>;
  errorMsg: string;
  contentDelta: DeltaStatic;
  setContentDelta: React.Dispatch<React.SetStateAction<DeltaStatic>>;
  disabled: boolean;
  onCancel: (e: React.MouseEvent) => void;
  author: Account;
  editorValue: string;
  shouldFocus?: boolean;
  tooltipText?: string;
  isReplying?: boolean;
  aiCommentsToggleEnabled?: boolean;
  setAICommentsToggleEnabled?: (value: boolean) => void;
  onAiReply?: (commentId: number) => void;
  onCommentCreated?: (commentId: number, hasAI: boolean) => void;
  replyingToAuthor?: string;
  streamingReplyIds?: number[];
};

const CommentEditor = ({
  parentType,
  canComment,
  handleSubmitComment,
  errorMsg,
  contentDelta,
  setContentDelta,
  disabled,
  onCancel,
  author,
  shouldFocus,
  tooltipText,
  isReplying,
  aiCommentsToggleEnabled: initialAiStreaming,
  setAICommentsToggleEnabled: onAiStreamingChange,
  onAiReply,
  onCommentCreated,
}: CommentEditorProps) => {
  const {
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
    aiCommentsFeatureEnabled,
  } = useAiToggleState();

  const effectiveAiStreaming = initialAiStreaming ?? aiCommentsToggleEnabled;
  const effectiveSetAiStreaming =
    onAiStreamingChange ?? setAICommentsToggleEnabled;

  const handleAiToggle = useCallback(() => {
    if (effectiveSetAiStreaming) {
      effectiveSetAiStreaming(!effectiveAiStreaming);
    }
  }, [effectiveAiStreaming, effectiveSetAiStreaming]);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const { generateComment } = useGenerateCommentText();

  const handleCommentWithAI = () => {
    setIsSubmitDisabled(true);
    let text = '';
    setContentDelta(text);
    generateComment('userText', (x) => {
      text += `${x}`;
      text = text.trim();
      setContentDelta(text);
    })
      .catch(console.error)
      .finally(() => setIsSubmitDisabled(false));
  };

  const handleEnhancedSubmit = async () => {
    // Immediately close the editor before any operations
    onCancel?.(
      new MouseEvent('click', {
        bubbles: true,
      }) as unknown as React.MouseEvent,
    );

    // Handle the rest of the submission process asynchronously
    try {
      let commentId: number;
      try {
        commentId = await handleSubmitComment();
      } catch (error) {
        console.error('Failed to submit comment:', error);
        return;
      }

      // Ensure we have a valid comment ID before proceeding
      if (typeof commentId !== 'number' || isNaN(commentId)) {
        console.error('Invalid comment ID:', commentId);
        return;
      }

      if (onCommentCreated) {
        onCommentCreated(commentId, !!effectiveAiStreaming);
      }

      // Handle AI streaming and comment jumping asynchronously
      setTimeout(() => {
        // If AI streaming is enabled, trigger the AI reply through TreeHierarchy
        if (effectiveAiStreaming === true && onAiReply) {
          Promise.resolve(onAiReply(commentId)).catch((error) => {
            console.error('Failed to trigger AI reply:', error);
            notifyError('Failed to generate AI reply');
          });
        }

        // Function to attempt jumping to the comment
        const attemptJump = () => {
          const commentElement = document.querySelector(
            `.comment-${commentId}`,
          );
          if (commentElement) {
            jumpHighlightComment(commentId, effectiveAiStreaming === true);
            return true;
          }
          return false;
        };

        // Try to jump to the comment
        if (!attemptJump()) {
          const container = document.querySelector('.CommentsTree');
          if (container) {
            const observer = new MutationObserver((mutations, obs) => {
              if (attemptJump()) {
                obs.disconnect();
              }
            });
            observer.observe(container, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 5000);
          }
        }
      }, 0);
    } catch (error) {
      console.error('Error during submission:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // If Enter is pressed and any modifier key is present (using isCommandClick), trigger submission
    if (
      event.key === 'Enter' &&
      isCommandClick(event as unknown as React.MouseEvent<HTMLDivElement>)
    ) {
      event.preventDefault();
      void handleEnhancedSubmit();
    }
  };

  return (
    <div className="CommentEditor">
      <div className="attribution-row">
        <div className="attribution-left-content">
          <CWText type="caption">
            {parentType === ContentType.Comment ? 'Reply as' : 'Comment as'}
          </CWText>
          <CWText
            type="caption"
            fontWeight="medium"
            className={clsx('user-link-text', { disabled: !canComment })}
          >
            <User
              userAddress={author?.address}
              userCommunityId={author?.community?.id}
              shouldShowAsDeleted={!author?.address && !author?.community?.id}
              shouldHideAvatar
              shouldLinkProfile
            />
          </CWText>
        </div>
        <div className="attribution-right-content">
          {aiCommentsFeatureEnabled && (
            <div className="ai-toggle-wrapper">
              <CWToggle
                className="ai-toggle"
                checked={effectiveAiStreaming === true}
                onChange={handleAiToggle}
                icon="sparkle"
                size="xs"
                iconColor="#757575"
              />
              <span className="label">AI</span>
            </div>
          )}
        </div>
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
      </div>
      <div className="ml-auto">
        {effectiveAiStreaming && (
          <CWThreadAction
            action="ai-reply"
            label={`Generate AI ${!isReplying ? 'Comment' : 'Reply'}`}
            disabled={isSubmitDisabled}
            onClick={handleCommentWithAI}
          />
        )}
      </div>
      <ReactQuillEditor
        className="editor"
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
        isDisabled={!canComment}
        tooltipLabel={tooltipText}
        shouldFocus={shouldFocus}
        onKeyDown={handleKeyDown}
      />
      <div className="form-bottom">
        <div className="form-buttons">
          <CWButton buttonType="tertiary" onClick={onCancel} label="Cancel" />
          <CWButton
            buttonWidth="wide"
            disabled={disabled || isSubmitDisabled}
            onClick={() => void handleEnhancedSubmit()}
            label="Post"
          />
        </div>
      </div>
    </div>
  );
};

export default CommentEditor;
