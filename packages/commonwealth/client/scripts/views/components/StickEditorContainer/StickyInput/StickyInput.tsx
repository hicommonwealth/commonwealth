import { ContentType } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { Thread } from 'models/Thread';
import type { Topic } from 'models/Topic';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useAiCompletion } from 'state/api/ai';
import {
  generateCommentPrompt,
  generateThreadPrompt,
} from 'state/api/ai/prompts';
import useSidebarStore from 'state/ui/sidebar';
import { useLocalAISettingsStore } from 'state/ui/user';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  NewThreadForm,
  NewThreadFormHandles,
} from 'views/components/NewThreadFormLegacy/NewThreadForm';
import {
  createDeltaFromText,
  ReactQuillEditor,
} from 'views/components/react_quill_editor';
import { useTurnstile } from 'views/components/useTurnstile';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import { StickCommentContext } from '../context/StickCommentProvider';
import { useActiveStickCommentReset } from '../context/UseActiveStickCommentReset';

import './StickyInput.scss';

interface StickyInputProps extends CommentEditorProps {
  topic?: Topic;
  parentType: ContentType;
  thread?: Thread;
}

const StickyInput = (props: StickyInputProps) => {
  const {
    handleSubmitComment,
    isReplying,
    replyingToAuthor,
    setContentDelta,
    contentDelta,
    thread: originalThread,
    parentCommentText,
  } = props;
  const { isWindowExtraSmall: isMobile } = useBrowserWindow({});
  const { menuVisible } = useSidebarStore();
  const { mode, setIsExpanded, isExpanded } = useContext(StickCommentContext);
  const {
    aiCommentsToggleEnabled,
    aiInteractionsToggleEnabled,
    setAICommentsToggleEnabled,
  } = useLocalAISettingsStore();
  const stickyCommentReset = useActiveStickCommentReset();
  const { generateCompletion } = useAiCompletion();
  const aiCommentsFeatureEnabled = useFlag('aiComments');

  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const [openModalOnExpand, setOpenModalOnExpand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const newThreadFormRef = useRef<NewThreadFormHandles>(null);
  const bodyAccumulatedRef = useRef('');

  const {
    turnstileToken,
    isTurnstileEnabled,
    TurnstileWidget,
    resetTurnstile,
  } = useTurnstile({
    action: mode === 'thread' ? 'create-thread' : 'create-comment',
  });

  const handleThreadContentAppended = useCallback(
    (markdown: string) => {
      if (markdown !== contentDelta) {
        setContentDelta(createDeltaFromText(markdown));
      }
    },
    [contentDelta, setContentDelta],
  );

  const handleCancel = useCallback(() => {
    setIsExpanded(false);
    setOpenModalOnExpand(false);
    stickyCommentReset();

    if (isTurnstileEnabled) {
      resetTurnstile();
    }
  }, [stickyCommentReset, isTurnstileEnabled, resetTurnstile, setIsExpanded]);

  const handleAiReply = useCallback(
    (commentId: number) => {
      if (streamingReplyIds.includes(commentId)) {
        return;
      }
      setStreamingReplyIds((prev) => [...prev, commentId]);
    },
    [streamingReplyIds],
  );

  const handleImageClick = useCallback(() => {
    setOpenModalOnExpand(true);
    setIsExpanded(true);
  }, [setOpenModalOnExpand, setIsExpanded]);

  const handleGenerateAIContent = useCallback(async () => {
    if (!aiCommentsFeatureEnabled || !aiInteractionsToggleEnabled) return;

    setIsGenerating(true);
    bodyAccumulatedRef.current = '';

    try {
      if (mode === 'thread') {
        const threadPrompt = generateThreadPrompt('');

        await generateCompletion(threadPrompt, {
          model: 'gpt-4o-mini',
          stream: true,
          onError: (error) => {
            console.error('Error generating AI thread:', error);
          },
          onChunk: (chunk) => {
            bodyAccumulatedRef.current += chunk;
            setContentDelta(createDeltaFromText(bodyAccumulatedRef.current));
          },
        });
      } else {
        const context = `
          Thread: ${originalThread?.title || ''}
          ${parentCommentText ? `Parent Comment: ${parentCommentText}` : ''}
        `;

        const commentPrompt = generateCommentPrompt(context);

        await generateCompletion(commentPrompt, {
          model: 'gpt-4o-mini',
          stream: true,
          onError: (error) => {
            console.error('Error generating AI comment:', error);
          },
          onChunk: (chunk) => {
            bodyAccumulatedRef.current += chunk;
            setContentDelta(createDeltaFromText(bodyAccumulatedRef.current));
          },
        });
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    aiCommentsFeatureEnabled,
    aiInteractionsToggleEnabled,
    generateCompletion,
    mode,
    originalThread,
    parentCommentText,
    setContentDelta,
  ]);

  const getActionPillLabel = () => {
    if (mode === 'thread') {
      return 'Draft thread';
    } else if (isReplying) {
      return 'Draft reply';
    } else {
      return 'Draft comment';
    }
  };

  const customHandleSubmitComment = useCallback(async (): Promise<number> => {
    if (isTurnstileEnabled && !turnstileToken) {
      notifyError('Please complete the verification');
      return Promise.reject(new Error('Turnstile verification required'));
    }

    setOpenModalOnExpand(false);
    stickyCommentReset();

    try {
      const commentId = await handleSubmitComment(turnstileToken);

      if (typeof commentId !== 'number' || isNaN(commentId)) {
        console.error('StickyInput - Invalid comment ID:', commentId);
        throw new Error('Invalid comment ID');
      }

      // Also reset the editor content since it's separate from the store
      setContentDelta(createDeltaFromText(''));

      if (isTurnstileEnabled) {
        resetTurnstile();
      }

      if (aiCommentsToggleEnabled) {
        handleAiReply(commentId);
      }

      try {
        await listenForComment(commentId, aiCommentsToggleEnabled);
      } catch (error) {
        console.warn('StickyInput - Failed to jump to comment:', error);
      }

      return commentId;
    } catch (error) {
      console.error('StickyInput - Failed to submit comment:', error);
      if (isTurnstileEnabled) {
        resetTurnstile();
      }
      throw error;
    }
  }, [
    handleSubmitComment,
    aiCommentsToggleEnabled,
    handleAiReply,
    turnstileToken,
    setContentDelta,
    stickyCommentReset,
    isTurnstileEnabled,
    resetTurnstile,
  ]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === 'Enter' &&
      !isExpanded &&
      contentDelta?.ops?.length > 0 &&
      (!isTurnstileEnabled || turnstileToken)
    ) {
      event.preventDefault();
      void customHandleSubmitComment();
    }
  };

  useEffect(() => {
    if (isExpanded && openModalOnExpand) {
      if (mode === 'thread') {
        setTimeout(() => {
          newThreadFormRef.current?.openImageModal();
        }, 0);
        setOpenModalOnExpand(false);
      } else if (mode === 'comment') {
        setOpenModalOnExpand(false);
      }
    }
  }, [isExpanded, openModalOnExpand, mode]);

  // Add toggle handler for the AI auto reply feature
  const handleToggleAiAutoReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
  };

  const renderStickyInput = () => {
    const buttonGroup = (
      <div className="button-group">
        {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
          <CWTooltip
            content={`${aiCommentsToggleEnabled ? 'Disable' : 'Enable'} 
        AI ${mode === 'thread' ? 'initial comment' : 'auto reply'}`}
            placement="top"
            renderTrigger={(handleInteraction) => (
              <button
                className={`ai-toggle-button ${aiCommentsToggleEnabled ? 'active' : 'inactive'}`}
                onClick={handleToggleAiAutoReply}
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
              >
                <CWIcon iconName="sparkle" iconSize="small" weight="bold" />
              </button>
            )}
          />
        )}

        <CWTooltip
          content="Add or generate image"
          placement="top"
          renderTrigger={(handleInteraction) => (
            <button
              className="image-button"
              onClick={(e) => {
                e.stopPropagation();
                handleImageClick();
              }}
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              <CWIcon iconName="image" iconSize="small" weight="bold" />
            </button>
          )}
        />

        <CWTooltip
          content="Expand editor"
          placement="top"
          renderTrigger={(handleInteraction) => (
            <button
              className="expand-button"
              onClick={() => setIsExpanded(true)}
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              <CWIcon
                iconName="arrowsOutSimple"
                iconSize="small"
                weight="bold"
              />
            </button>
          )}
        />

        <CWTooltip
          content={`Submit ${mode === 'thread' ? 'thread' : isReplying ? 'reply' : 'comment'}`}
          placement="top"
          renderTrigger={(handleInteraction) => (
            <button
              className="send-button"
              onClick={() => customHandleSubmitComment()}
              disabled={
                !contentDelta?.ops?.length ||
                (isTurnstileEnabled && !turnstileToken)
              }
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              <CWIcon
                iconName="paperPlaneTilt"
                iconSize="small"
                weight="bold"
              />
            </button>
          )}
        />
      </div>
    );

    const inputContent = (
      <div
        className={`StickyInput ${isExpanded ? 'expanded' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
        ref={containerRef}
        style={isMobile && menuVisible ? { zIndex: -1 } : undefined}
      >
        {isExpanded ? (
          <div
            className={`${isMobile ? 'MobileStickyInputFocused' : 'DesktopStickyInputExpanded'}`}
          >
            {isMobile && (
              <div className="mobile-editor-container">
                <div className="header-row">
                  <div className="left-section">
                    <CWText type="h4">
                      {mode === 'thread' ? 'Create Thread' : 'Write Comment'}
                    </CWText>
                  </div>
                </div>
              </div>
            )}

            {mode === 'thread' ? (
              <NewThreadForm
                ref={newThreadFormRef}
                onCancel={handleCancel}
                onContentAppended={handleThreadContentAppended}
                contentDelta={contentDelta}
                setContentDelta={setContentDelta}
              />
            ) : (
              <CommentEditor
                {...props}
                shouldFocus={true}
                onCancel={handleCancel}
                aiCommentsToggleEnabled={aiCommentsToggleEnabled}
                handleSubmitComment={customHandleSubmitComment}
                onAiReply={handleAiReply}
                streamingReplyIds={streamingReplyIds}
                triggerImageModalOpen={openModalOnExpand && mode === 'comment'}
                contentDelta={contentDelta}
                setContentDelta={setContentDelta}
              />
            )}
          </div>
        ) : (
          <>
            <div className="action-tags-container">
              <div className="tags-row">
                {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
                  <CWTag
                    key="draft"
                    type="pill"
                    classNames={`action-pill ${isGenerating ? 'disabled' : ''}`}
                    label={
                      isGenerating ? 'Generating...' : getActionPillLabel()
                    }
                    onClick={isGenerating ? undefined : handleGenerateAIContent}
                  />
                )}
                {isMobile && buttonGroup}
              </div>
            </div>

            <div className="input-row">
              <div className="text-input-container">
                <ReactQuillEditor
                  className="sticky-editor"
                  contentDelta={props.contentDelta}
                  setContentDelta={setContentDelta}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === 'thread'
                      ? 'Create a thread...'
                      : isReplying
                        ? `Reply to ${replyingToAuthor}...`
                        : isMobile
                          ? 'Comment on thread...'
                          : 'Write a comment...'
                  }
                />
              </div>
              {!isMobile && buttonGroup}
            </div>

            {isTurnstileEnabled && (
              <div className="turnstile-container">
                <TurnstileWidget />
              </div>
            )}
          </>
        )}
      </div>
    );

    if (isMobile) {
      const parent = document.getElementById('MobileNavigationHead');
      if (!parent) {
        console.warn('No parent container for mobile StickyInput');
        return null;
      }
      return createPortal(inputContent, parent);
    }

    return <div className="DesktopStickyInput">{inputContent}</div>;
  };

  return renderStickyInput();
};

export default StickyInput;
