import { ContentType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { notifyError } from 'controllers/app/notifications';
import { isCommandClick } from 'helpers';
import Account from 'models/Account';
import Thread from 'models/Thread';
import type { DeltaStatic } from 'quill';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { useAiCompletion } from 'state/api/ai';
import { generateCommentPrompt } from 'state/api/ai/prompts';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import { useAIFeatureEnabled, useUserAiSettingsStore } from 'state/ui/user';
import { useTurnstile } from 'views/components/useTurnstile';
import { User } from 'views/components/user/user';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import { ImageActionModal } from '../../ImageActionModal/ImageActionModal';
import { CWText } from '../../component_kit/cw_text';
import { CWValidationText } from '../../component_kit/cw_validation_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';
import { CWThreadAction } from '../../component_kit/new_designs/cw_thread_action';
import { CWToggle } from '../../component_kit/new_designs/cw_toggle';
import {
  createDeltaFromText,
  ReactQuillEditor,
} from '../../react_quill_editor';
import './CommentEditor.scss';

export type CommentEditorProps = {
  parentType: ContentType;
  canComment: boolean;
  handleSubmitComment: (turnstileToken?: string | null) => Promise<number>;
  handleIsReplying?: (isReplying: boolean) => void;
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
  triggerImageModalOpen?: boolean;
  placeholder?: string;
  webSearchEnabled?: boolean;
  setWebSearchEnabled?: (enabled: boolean) => void;
  communityId?: string;
};

// eslint-disable-next-line react/display-name
const CommentEditor = forwardRef<unknown, CommentEditorProps>(
  (
    {
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
      triggerImageModalOpen,
      placeholder,
      webSearchEnabled,
      setWebSearchEnabled,
      communityId,
    },
    _ref,
  ) => {
    const { isAIEnabled } = useAIFeatureEnabled();
    const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
      useUserAiSettingsStore();

    const effectiveAiStreaming = initialAiStreaming ?? aiCommentsToggleEnabled;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [localWebSearchEnabled, setLocalWebSearchEnabled] = useState(false);
    const effectiveWebSearchEnabled =
      typeof webSearchEnabled === 'boolean'
        ? webSearchEnabled
        : localWebSearchEnabled;
    const effectiveSetWebSearchEnabled =
      setWebSearchEnabled || setLocalWebSearchEnabled;

    const { generateCompletion } = useAiCompletion();

    const {
      resetTurnstile,
      turnstileToken,
      isTurnstileEnabled,
      TurnstileWidget,
    } = useTurnstile({
      action: 'create-comment',
    });

    // Fetch community details
    const { data: community } = useGetCommunityByIdQuery({
      id: thread?.communityId || '',
      enabled: !!thread?.communityId,
    });

    const handleCommentWithAI = () => {
      setIsSubmitDisabled(true);
      let text = '';
      setContentDelta(text);

      // Construct extended context with community details
      const communityName = community?.name || 'this community';
      const communityDescription =
        community?.description || 'No specific description provided.';
      const extendedContext = `Extended Community Context:
Community Name: ${communityName}
Community Description: ${communityDescription}`;

      const originalContext = `Thread Title: ${thread?.title || ''}
${parentCommentText ? `Parent Comment: ${parentCommentText}` : ''}`;

      const context = `${extendedContext}\n\nOriginal Context (Thread and Parent Comment):\n${originalContext.trim()}`;

      const { systemPrompt, userPrompt } = generateCommentPrompt(context);

      generateCompletion(userPrompt, {
        model: 'gpt-4o-mini',
        stream: true,
        systemPrompt,
        includeContextualMentions: true,
        communityId: communityId || thread?.communityId,
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
      if (isTurnstileEnabled && !turnstileToken) {
        notifyError('Please complete the verification');
        return;
      }

      // Handle the rest of the submission process asynchronously
      try {
        let commentId: number;
        try {
          commentId = await handleSubmitComment(turnstileToken);
        } catch (error) {
          console.error('Failed to submit comment:', error);
          if (isTurnstileEnabled) {
            resetTurnstile();
          }
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
        if (isTurnstileEnabled) {
          resetTurnstile();
        }
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

    const handleOpenImageModal = useCallback(() => {
      setIsImageModalOpen(true);
    }, []);

    const handleApplyImage = useCallback(
      (imageUrl: string) => {
        setIsImageModalOpen(false);
        const imageMarkdown = `\n![Generated image](${imageUrl})\n`;
        const imageDelta = createDeltaFromText(imageMarkdown);

        setContentDelta((prevDelta) => {
          // Ensure prevDelta is a valid delta structure
          const validPrevDelta =
            prevDelta && Array.isArray(prevDelta.ops) ? prevDelta : { ops: [] };

          // Manually combine ops arrays
          const newOps = [...validPrevDelta.ops, ...imageDelta.ops];
          return { ops: newOps };
        });
      },
      [setContentDelta],
    );

    useEffect(() => {
      if (triggerImageModalOpen) {
        handleOpenImageModal();
      }
    }, [triggerImageModalOpen, handleOpenImageModal]);

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
          placeholder={placeholder}
        />

        {isTurnstileEnabled && <TurnstileWidget />}

        <div className="form-bottom">
          <div className="form-buttons">
            <CWButton
              buttonType="tertiary"
              containerClassName="cancel-button"
              onClick={onCancel}
              label="Cancel"
            />
            <div className="attribution-right-content">
              <CWThreadAction
                action="image"
                label="Add or Generate Image"
                onClick={handleOpenImageModal}
              />
              {isAIEnabled && (
                <CWThreadAction
                  action="ai-reply"
                  label={`Draft AI ${!isReplying ? 'Comment' : 'Reply'}`}
                  disabled={isSubmitDisabled}
                  onClick={handleCommentWithAI}
                />
              )}
            </div>

            {isAIEnabled && (
              <div className="ai-toggle-wrapper">
                <CWTooltip
                  content={`${aiCommentsToggleEnabled ? 'Disable' : 'Enable'} AI auto reply`}
                  placement="top"
                  renderTrigger={() => (
                    <CWToggle
                      className="ai-toggle"
                      icon="sparkle"
                      iconColor="#757575"
                      checked={aiCommentsToggleEnabled}
                      onChange={() => {
                        setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
                      }}
                    />
                  )}
                />
                <CWText type="caption" className="toggle-label">
                  AI auto reply
                </CWText>
              </div>
            )}
            {isAIEnabled && (
              <div className="ai-toggle-wrapper">
                <CWTooltip
                  content={`${effectiveWebSearchEnabled ? 'Disable' : 'Enable'} Web Search`}
                  placement="top"
                  renderTrigger={() => (
                    <div className="ai-toggle-wrapper">
                      <CWToggle
                        className="ai-toggle"
                        icon="binoculars"
                        iconColor="#757575"
                        checked={effectiveWebSearchEnabled}
                        onChange={() =>
                          effectiveSetWebSearchEnabled(
                            !effectiveWebSearchEnabled,
                          )
                        }
                      />
                      <CWText type="caption" className="toggle-label">
                        Web search
                      </CWText>
                    </div>
                  )}
                />
              </div>
            )}
            <CWButton
              containerClassName="post-button"
              buttonWidth="narrow"
              disabled={
                disabled ||
                isSubmitDisabled ||
                (isTurnstileEnabled && !turnstileToken)
              }
              onClick={() => void handleEnhancedSubmit()}
              label="Post"
            />
          </div>
        </div>
        {isImageModalOpen && (
          <ImageActionModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            onApply={handleApplyImage}
            applyButtonLabel="Add to Comment"
          />
        )}
      </div>
    );
  },
);

export default CommentEditor;
