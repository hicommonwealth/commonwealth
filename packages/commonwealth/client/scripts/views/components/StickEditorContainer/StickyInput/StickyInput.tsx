import { notifyError } from 'controllers/app/notifications';
import { useFlag } from 'hooks/useFlag';
import useResetStickyInputOnRouteChange from 'hooks/useResetStickyInputOnRouteChange';
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
import useStickyInputStore, { StickyInputMode } from 'state/ui/stickyInput';
import { useLocalAISettingsStore } from 'state/ui/user';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import CWTextInput from 'views/components/component_kit/new_designs/CWTextInput/CWTextInput';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  NewThreadForm,
  NewThreadFormHandles,
} from 'views/components/NewThreadFormLegacy/NewThreadForm';
import { createDeltaFromText } from 'views/components/react_quill_editor';
import { useTurnstile } from 'views/components/useTurnstile';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import { StickCommentContext } from '../context/StickCommentProvider';
import { useActiveStickCommentReset } from '../context/UseActiveStickCommentReset';

import './StickyInput.scss';

export type ThreadMentionTagType = 'threadMention' | 'modelMention';

interface StickyInputProps extends CommentEditorProps {
  isMobile?: boolean;
}

const StickyInput = (props: StickyInputProps) => {
  const {
    isMobile = false,
    handleSubmitComment,
    isReplying,
    replyingToAuthor,
    onCancel,
    setContentDelta,
    thread: originalThread,
    parentCommentText,
  } = props;

  useResetStickyInputOnRouteChange(setContentDelta);

  const { menuVisible } = useSidebarStore();
  const { mode: contextMode } = useContext(StickCommentContext);
  const {
    aiCommentsToggleEnabled,
    aiInteractionsToggleEnabled,
    setAICommentsToggleEnabled,
  } = useLocalAISettingsStore();
  const stickyCommentReset = useActiveStickCommentReset();
  const { generateCompletion } = useAiCompletion();
  const aiCommentsFeatureEnabled = useFlag('aiComments');

  const {
    inputValue,
    expanded,
    mode,
    setInputValue,
    setExpanded,
    resetContent,
    setMode,
    resetState,
  } = useStickyInputStore();

  useEffect(() => {
    setMode(contextMode as StickyInputMode);
  }, [contextMode, setMode]);

  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const [openModalOnExpand, setOpenModalOnExpand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const newThreadFormRef = useRef<NewThreadFormHandles>(null);
  const bodyAccumulatedRef = useRef('');

  // Add this ref for tracking the previous expanded state
  const prevExpandedRef = useRef(false);
  // Add a flag to control whether to sync content when expanding
  const shouldSyncOnExpandRef = useRef(true);

  const {
    turnstileToken,
    isTurnstileEnabled,
    TurnstileWidget,
    resetTurnstile,
  } = useTurnstile({
    action: mode === 'thread' ? 'create-thread' : 'create-comment',
  });

  // Sync from input value to delta - only when input is the source
  useEffect(() => {
    if (inputValue && !expanded) {
      setContentDelta(createDeltaFromText(inputValue));
    }
  }, [inputValue, setContentDelta, expanded]);

  // Handle content initialization when expanding
  useEffect(() => {
    // Only sync content when expanding (not when already expanded)
    if (
      expanded &&
      !prevExpandedRef.current &&
      inputValue &&
      shouldSyncOnExpandRef.current
    ) {
      if (mode === 'thread' && newThreadFormRef.current?.appendContent) {
        // Use a timeout to ensure the NewThreadForm is fully rendered
        setTimeout(() => {
          newThreadFormRef.current?.appendContent(inputValue);
        }, 0);
      } else if (mode === 'comment') {
        setContentDelta(createDeltaFromText(inputValue));
      }
    }

    // Update the ref with current value for next render
    prevExpandedRef.current = expanded;
  }, [expanded, mode, setContentDelta, inputValue]);

  // Sync from contentDelta to input value - only for compact view or comment mode
  useEffect(() => {
    if (props.contentDelta?.ops) {
      try {
        const text = props.contentDelta.ops.reduce((acc, op) => {
          if (typeof op.insert === 'string') {
            return acc + op.insert;
          }
          return acc;
        }, '');

        if (text && text !== inputValue) {
          // In thread mode, only update input from delta when in compact view
          if (!expanded || mode === 'comment') {
            setInputValue(text, 'editor');
          }
        }
      } catch (error) {
        console.error('Error extracting text from props.contentDelta:', error);
      }
    }
  }, [props.contentDelta, inputValue, setInputValue, expanded, mode]);

  // Add this new useEffect to reset content upon cancellation
  useEffect(() => {
    // If transitioning from expanded to collapsed without submission
    if (prevExpandedRef.current && !expanded) {
      // Reset content when collapsing (canceling)
      resetContent();
      setContentDelta(createDeltaFromText(''));
    }
  }, [expanded, resetContent, setContentDelta]);

  // Make the sync ref available to the useResetStickyInputOnRouteChange hook
  useEffect(() => {
    (window as any).__stickyInputSyncRef = shouldSyncOnExpandRef;
    return () => {
      (window as any).__stickyInputSyncRef = undefined;
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value, 'input');
  };

  const handleThreadContentAppended = useCallback(
    (markdown: string) => {
      if (markdown !== inputValue) {
        // Temporarily disable syncing from input to NewThreadForm
        shouldSyncOnExpandRef.current = false;
        setInputValue(markdown, 'editor');
        // Re-enable syncing after the update has been processed
        setTimeout(() => {
          shouldSyncOnExpandRef.current = true;
        }, 100);
      }
    },
    [inputValue, setInputValue],
  );

  const handleFocused = () => {
    setExpanded(true);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handleCancel = useCallback(
    (e: React.MouseEvent | undefined) => {
      // Temporarily disable syncing to prevent unwanted updates
      shouldSyncOnExpandRef.current = false;
      setExpanded(false);
      setOpenModalOnExpand(false);
      stickyCommentReset();
      if (isTurnstileEnabled) {
        resetTurnstile();
      }
      onCancel?.(e);

      // Re-enable syncing after a short delay
      setTimeout(() => {
        shouldSyncOnExpandRef.current = true;
      }, 100);
    },
    [
      onCancel,
      stickyCommentReset,
      isTurnstileEnabled,
      resetTurnstile,
      setExpanded,
    ],
  );

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
    handleFocused();
  }, []);

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
            setInputValue(bodyAccumulatedRef.current, 'input');
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
            setInputValue(bodyAccumulatedRef.current, 'input');
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
    setInputValue,
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

    // Temporarily disable syncing to prevent unwanted updates
    shouldSyncOnExpandRef.current = false;
    setExpanded(false);
    setOpenModalOnExpand(false);
    stickyCommentReset();

    try {
      const commentId = await handleSubmitComment(turnstileToken);

      if (typeof commentId !== 'number' || isNaN(commentId)) {
        console.error('StickyInput - Invalid comment ID:', commentId);
        throw new Error('Invalid comment ID');
      }

      // Use the resetState function to fully reset all state in one call
      resetState();
      resetContent();
      setInputValue('', 'input');
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

      // Re-enable syncing after a short delay
      setTimeout(() => {
        shouldSyncOnExpandRef.current = true;
      }, 100);

      return commentId;
    } catch (error) {
      console.error('StickyInput - Failed to submit comment:', error);
      if (isTurnstileEnabled) {
        resetTurnstile();
      }
      // Re-enable syncing in case of error
      setTimeout(() => {
        shouldSyncOnExpandRef.current = true;
      }, 100);
      throw error;
    }
  }, [
    handleSubmitComment,
    aiCommentsToggleEnabled,
    handleAiReply,
    turnstileToken,
    resetContent,
    setInputValue,
    setContentDelta,
    stickyCommentReset,
    isTurnstileEnabled,
    resetTurnstile,
    setExpanded,
    resetState,
  ]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === 'Enter' &&
      !expanded &&
      inputValue.trim() !== '' &&
      (!isTurnstileEnabled || turnstileToken)
    ) {
      event.preventDefault();
      void customHandleSubmitComment();
    }
  };

  useEffect(() => {
    if (expanded && openModalOnExpand) {
      if (mode === 'thread') {
        setTimeout(() => {
          newThreadFormRef.current?.openImageModal();
        }, 0);
        setOpenModalOnExpand(false);
      } else if (mode === 'comment') {
        setOpenModalOnExpand(false);
      }
    }
  }, [expanded, openModalOnExpand, mode]);

  // Add toggle handler for the AI auto reply feature
  const handleToggleAiAutoReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
  };

  const renderStickyInput = () => {
    const inputContent = (
      <div
        className={`StickyInput ${expanded ? 'expanded' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
        ref={containerRef}
        style={isMobile && menuVisible ? { zIndex: -1 } : undefined}
      >
        {expanded ? (
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
                onContentDeltaChange={(markdown: string) => {
                  setInputValue(markdown, 'editor');
                }}
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
                editorValue={inputValue}
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
              </div>
            </div>

            <div className="input-row">
              <div className="text-input-container">
                <CWTextInput
                  inputRef={inputRef}
                  fullWidth
                  isCompact
                  value={inputValue}
                  onInput={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
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

              <div className="button-group">
                {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
                  <CWTooltip
                    content={`${aiCommentsToggleEnabled ? 'Disable' : 'Enable'} 
                    AI ${mode === 'thread' ? 'initial comment' : 'auto reply'}`}
                    placement="top"
                    renderTrigger={(handleInteraction, isOpen) => (
                      <button
                        className={`ai-toggle-button ${aiCommentsToggleEnabled ? 'active' : 'inactive'}`}
                        onClick={handleToggleAiAutoReply}
                        onMouseEnter={handleInteraction}
                        onMouseLeave={handleInteraction}
                        data-tooltip-open={isOpen}
                      >
                        <CWIcon
                          iconName="sparkle"
                          iconSize="small"
                          weight="bold"
                        />
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
                      onClick={handleFocused}
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
                        !inputValue.trim() ||
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
