import { CompletionModel, ContentType } from '@hicommonwealth/shared';
import ClickAwayListener from '@mui/base/ClickAwayListener';
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
import { AIModelSelector } from 'views/components/AIModelSelector';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
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
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from 'views/menus/utils';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import { StickCommentContext } from '../context/StickCommentProvider';
import { useActiveStickCommentReset } from '../context/UseActiveStickCommentReset';
import { useDynamicPlaceholder } from './useDynamicPlaceholder';
import {
  AI_SELECTOR_TITLE,
  availableModels,
  getCompletionModelValue,
  MAX_MODELS_SELECTABLE,
} from './utils';

import './StickyInput.scss';

interface StickyInputProps extends CommentEditorProps {
  topic?: Topic;
  parentType: ContentType;
  thread?: Thread;
  communityId?: string;
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
    canComment,
    handleIsReplying,
  } = props;
  const { isWindowExtraSmall: isMobile } = useBrowserWindow({});
  const { menuVisible } = useSidebarStore();
  const { mode, setIsExpanded, isExpanded } = useContext(StickCommentContext);
  const {
    aiCommentsToggleEnabled,
    aiInteractionsToggleEnabled,
    setAICommentsToggleEnabled,
    selectedModels,
    setSelectedModels,
  } = useLocalAISettingsStore();
  const stickyCommentReset = useActiveStickCommentReset();
  const { generateCompletion } = useAiCompletion();
  const aiCommentsFeatureEnabled = useFlag('aiComments');

  const aiModelPopover = usePopover();

  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const [openModalOnExpand, setOpenModalOnExpand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const placeholderText = useDynamicPlaceholder({
    mode,
    isReplying: !!isReplying,
    replyingToAuthor,
    isMobile,
  });

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
    const modelToUse = getCompletionModelValue(selectedModels[0]);

    try {
      if (mode === 'thread') {
        const { systemPrompt, userPrompt } = generateThreadPrompt('');
        let lastUpdateTime = Date.now();

        await generateCompletion(userPrompt, {
          model: modelToUse,
          stream: true,
          systemPrompt,
          useWebSearch: webSearchEnabled,
          includeContextualMentions: true,
          communityId: props.communityId,
          onError: (error) => {
            console.error('Error generating AI thread:', error);
            notifyError('Failed to generate AI thread content');
          },
          onChunk: (chunk) => {
            bodyAccumulatedRef.current += chunk;

            const currentTime = Date.now();
            if (currentTime - lastUpdateTime >= 500) {
              setContentDelta(createDeltaFromText(bodyAccumulatedRef.current));
              lastUpdateTime = currentTime;
            }
          },
        });

        setContentDelta(createDeltaFromText(bodyAccumulatedRef.current));
      } else {
        const context = `
          Thread: ${originalThread?.title || ''}
          ${parentCommentText ? `Parent Comment: ${parentCommentText}` : ''}
        `;

        const { systemPrompt, userPrompt } = generateCommentPrompt(context);

        await generateCompletion(userPrompt, {
          model: modelToUse,
          stream: true,
          systemPrompt,
          useWebSearch: webSearchEnabled,
          includeContextualMentions: true,
          communityId: props.communityId,
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
    webSearchEnabled,
    selectedModels,
    props.communityId,
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
      !event.shiftKey &&
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

  const handleModelSelectionChange = (
    newSelectedModelValues: CompletionModel[],
  ) => {
    const newAiModelOptions = newSelectedModelValues.map((value) => {
      const modelDetails = availableModels.find((m) => m.value === value);
      return {
        value: value,
        label: modelDetails ? modelDetails.label : value,
      };
    });
    setSelectedModels(newAiModelOptions);

    if (newAiModelOptions.length > 0 && !aiCommentsToggleEnabled) {
      setAICommentsToggleEnabled(true);
    } else if (newAiModelOptions.length === 0 && aiCommentsToggleEnabled) {
      setAICommentsToggleEnabled(false);
    }
  };

  const handleToggleWebSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWebSearchEnabled((prev) => !prev);
  };

  const renderStickyInput = () => {
    const isAnyModelSelected = selectedModels.length > 0;
    const showModelCountBadge = selectedModels.length > 1;

    const buttonGroup = (
      <div className="button-group">
        {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
          <CWTooltip
            content={`${webSearchEnabled ? 'Disable' : 'Enable'} Web Search`}
            placement="top"
            renderTrigger={(tooltipInteractionHandler) => (
              <button
                className={`web-search-toggle-button ${webSearchEnabled ? 'active' : 'inactive'}`}
                onClick={handleToggleWebSearch}
                onMouseEnter={tooltipInteractionHandler}
                onMouseLeave={tooltipInteractionHandler}
              >
                <CWIcon iconName="binoculars" iconSize="small" weight="bold" />
              </button>
            )}
          />
        )}
        {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
          <ClickAwayListener onClickAway={() => aiModelPopover.dispose()}>
            <div className="popover-container">
              <CWTooltip
                content="Select AI models to generate replies"
                placement="top"
                renderTrigger={(tooltipInteractionHandler, isTooltipOpen) => (
                  <button
                    className={`ai-toggle-button ${isAnyModelSelected ? 'active' : 'inactive'}`}
                    onClick={(e) =>
                      handleIconClick({
                        e,
                        isMenuOpen: aiModelPopover.open,
                        isTooltipOpen,
                        handleInteraction: tooltipInteractionHandler,
                        onClick: aiModelPopover.handleInteraction,
                      })
                    }
                    onMouseEnter={(e) => {
                      handleMouseEnter({
                        e,
                        isMenuOpen: aiModelPopover.open,
                        handleInteraction: tooltipInteractionHandler,
                      });
                    }}
                    onMouseLeave={(e) => {
                      handleMouseLeave({
                        e,
                        isTooltipOpen,
                        handleInteraction: tooltipInteractionHandler,
                      });
                    }}
                  >
                    <CWIcon iconName="sparkle" iconSize="small" weight="bold" />
                    {showModelCountBadge && (
                      <span className="model-count-badge">
                        {selectedModels.length}
                      </span>
                    )}
                  </button>
                )}
              />
              <CWPopover
                {...aiModelPopover}
                placement="top"
                modifiers={[
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 8],
                    },
                  },
                ]}
                content={
                  <AIModelSelector
                    title={AI_SELECTOR_TITLE}
                    availableModels={availableModels}
                    selectedModelValues={selectedModels.map((m) =>
                      getCompletionModelValue(m),
                    )}
                    onSelectionChange={handleModelSelectionChange}
                    maxSelection={MAX_MODELS_SELECTABLE}
                    popoverId={aiModelPopover.id}
                  />
                }
              />
            </div>
          </ClickAwayListener>
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
              onClick={() => {
                customHandleSubmitComment().catch(console.error);
              }}
              disabled={
                !canComment ||
                !contentDelta?.ops?.length ||
                isGenerating ||
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
        className={`StickyInput ${isExpanded ? 'expanded' : 'not-expanded'} ${isMobile ? 'mobile' : 'desktop'} ${mode === 'thread' ? 'thread-mode' : ''}`}
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
                webSearchEnabled={webSearchEnabled}
                setWebSearchEnabled={setWebSearchEnabled}
                communityId={props.communityId}
              />
            ) : (
              <CommentEditor
                {...props}
                shouldFocus={true}
                onCancel={handleCancel}
                aiCommentsToggleEnabled={
                  aiCommentsToggleEnabled && selectedModels.length > 0
                }
                handleSubmitComment={customHandleSubmitComment}
                onAiReply={handleAiReply}
                streamingReplyIds={streamingReplyIds}
                triggerImageModalOpen={openModalOnExpand && mode === 'comment'}
                contentDelta={contentDelta}
                setContentDelta={setContentDelta}
                webSearchEnabled={webSearchEnabled}
                setWebSearchEnabled={setWebSearchEnabled}
                communityId={props.communityId}
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
                  setContentDelta={props.setContentDelta}
                  isDisabled={!canComment}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                />
              </div>

              {!isMobile && buttonGroup}
            </div>
            {isReplying && (
              <div
                className="cancel-reply-button"
                onClick={() => {
                  handleIsReplying?.(false);
                }}
              >
                <CWIcon iconName="close" iconSize="small" weight="bold" />
                <CWText type="caption">Cancel reply</CWText>
              </div>
            )}
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
