import { ContentType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { notifyError } from 'controllers/app/notifications';
import { isCommandClick } from 'helpers';
import { useFlag } from 'hooks/useFlag';
import Account from 'models/Account';
import Thread from 'models/Thread';
import type { DeltaStatic } from 'quill';
import React, { useState } from 'react';
import { useAiCompletion } from 'state/api/ai';
import { generateCommentPrompt } from 'state/api/ai/prompts';
import { useLocalAISettingsStore } from 'state/ui/user';
import { User } from 'views/components/user/user';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
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
  onCancel: (e: React.MouseEvent | undefined) => void;
  author: Account;
  editorValue: string;
  shouldFocus?: boolean;
  tooltipText?: string;
  isReplying?: boolean;
  aiCommentsToggleEnabled?: boolean;
  onAiReply?: (commentId: number) => void;
  onCommentCreated?: (commentId: number, hasAI: boolean) => void;
  replyingToAuthor?: string;
  streamingReplyIds?: number[];
  thread?: Thread;
  parentCommentText?: string;
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
  onAiReply,
  onCommentCreated,
  thread,
  parentCommentText,
}: CommentEditorProps) => {
  const aiCommentsFeatureEnabled = useFlag('aiComments');
  const {
    aiCommentsToggleEnabled,
    aiInteractionsToggleEnabled,
    setAICommentsToggleEnabled,
  } = useLocalAISettingsStore();

  const effectiveAiStreaming = initialAiStreaming ?? aiCommentsToggleEnabled;

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const { generateCompletion } = useAiCompletion();

  const handleCommentWithAI = () => {
    setIsSubmitDisabled(true);
    let text = '';
    setContentDelta(text);

    const context = `
    Thread: ${thread?.title || ''}
    ${parentCommentText ? `Parent Comment: ${parentCommentText}` : ''}
    `;

    const prompt = generateCommentPrompt(context);

    generateCompletion(prompt, {
      stream: true,
      onError: (error) => {
        console.error('Error generating AI comment:', error);
        notifyError('Failed to generate AI comment');
        setIsSubmitDisabled(false);
      },
      onChunk: (chunk) => {
        text += chunk;
        text = text.trim();
        setContentDelta(text);
      },
      onComplete: () => {
        setIsSubmitDisabled(false);
      },
    }).catch((error) => {
      console.error('Failed to generate comment:', error);
      setIsSubmitDisabled(false);
    });
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

        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
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
          <CWButton
            buttonType="tertiary"
            containerClassName="cancel-button"
            onClick={onCancel}
            label="Cancel"
          />
          <div className="attribution-right-content">
            <div className="ml-auto">
              {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
                <CWThreadAction
                  action="ai-reply"
                  label={`Draft AI ${!isReplying ? 'Comment' : 'Reply'}`}
                  disabled={isSubmitDisabled}
                  onClick={handleCommentWithAI}
                />
              )}
            </div>
          </div>

          <div className="ai-toggle-wrapper">
            <CWToggle
              className="ai-toggle"
              icon="sparkle"
              iconColor="#757575"
              checked={aiCommentsToggleEnabled}
              onChange={() => {
                setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
              }}
            />
            <CWText type="caption" className="toggle-label">
              AI auto reply
            </CWText>
          </div>
          <CWButton
            containerClassName="post-button"
            buttonWidth="narrow"
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
