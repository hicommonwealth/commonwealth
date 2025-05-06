import { notifyError } from 'controllers/app/notifications';
import { useFlag } from 'hooks/useFlag';
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
import { useLocalAISettingsStore } from 'state/ui/user';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import CWTextInput from 'views/components/component_kit/new_designs/CWTextInput/CWTextInput';
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
import { MENTION_ITEMS, ModelItem, MODELS, ThreadItem, THREADS } from './utils';

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

  const { mode } = useContext(StickCommentContext);
  const { aiCommentsToggleEnabled, aiInteractionsToggleEnabled } =
    useLocalAISettingsStore();
  const stickyCommentReset = useActiveStickCommentReset();
  const { generateCompletion } = useAiCompletion();
  const aiCommentsFeatureEnabled = useFlag('aiComments');

  const [inputValue, setInputValue] = useState('');
  const [threadTags, setThreadTags] = useState<ThreadItem[]>([]);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelItem[]>([
    MODELS[0],
  ]);
  const [expanded, setExpanded] = useState(false);
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const [openModalOnExpand, setOpenModalOnExpand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const newThreadFormRef = useRef<NewThreadFormHandles>(null);
  const bodyAccumulatedRef = useRef('');
  const isUpdatingFromInputRef = useRef(false);
  const isUpdatingFromDeltaRef = useRef(false);
  const lastInputValueRef = useRef('');

  const {
    turnstileToken,
    isTurnstileEnabled,
    TurnstileWidget,
    resetTurnstile,
  } = useTurnstile({
    action: mode === 'thread' ? 'create-thread' : 'create-comment',
  });

  useEffect(() => {
    if (inputValue && !isUpdatingFromDeltaRef.current) {
      isUpdatingFromInputRef.current = true;
      setContentDelta(createDeltaFromText(inputValue));
      setTimeout(() => {
        isUpdatingFromInputRef.current = false;
      }, 0);
    }
  }, [inputValue, setContentDelta]);

  useEffect(() => {
    if (expanded && inputValue && mode === 'thread') {
      setTimeout(() => {
        if (newThreadFormRef.current?.appendContent) {
          newThreadFormRef.current.appendContent(inputValue);
        }
      }, 0);
    } else if (expanded && inputValue && mode === 'comment') {
      if (!isUpdatingFromDeltaRef.current) {
        isUpdatingFromInputRef.current = true;
        setContentDelta(createDeltaFromText(inputValue));
        setTimeout(() => {
          isUpdatingFromInputRef.current = false;
        }, 0);
      }
    }
  }, [expanded, mode, setContentDelta, inputValue]);

  useEffect(() => {
    if (props.contentDelta?.ops && !isUpdatingFromInputRef.current) {
      try {
        const text = props.contentDelta.ops.reduce((acc, op) => {
          if (typeof op.insert === 'string') {
            return acc + op.insert;
          }
          return acc;
        }, '');

        if (text && text !== inputValue && text !== lastInputValueRef.current) {
          lastInputValueRef.current = text;
          isUpdatingFromDeltaRef.current = true;
          setInputValue(text);
          setTimeout(() => {
            isUpdatingFromDeltaRef.current = false;
          }, 0);
        }
      } catch (error) {
        console.error('Error extracting text from props.contentDelta:', error);
      }
    }
  }, [props.contentDelta, inputValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    lastInputValueRef.current = value;
    setInputValue(value);

    const lastChar = value[value.length - 1];
    if (lastChar === '@') {
      setShowMentionPopover(true);
      setMentionSearch('');
    } else if (showMentionPopover) {
      const atIndex = value.lastIndexOf('@');
      if (atIndex >= 0) {
        setMentionSearch(value.slice(atIndex + 1));
      } else {
        setShowMentionPopover(false);
      }
    }
  };

  const handleThreadContentAppended = useCallback(
    (markdown: string) => {
      if (markdown !== inputValue) {
        lastInputValueRef.current = markdown;
        isUpdatingFromDeltaRef.current = true;
        setInputValue(markdown);
        setTimeout(() => {
          isUpdatingFromDeltaRef.current = false;
        }, 0);
      }
    },
    [inputValue],
  );

  const handleMentionSelect = (item: {
    id: string;
    name: string;
    type: 'thread' | 'model';
  }) => {
    let isUnselecting = false;

    if (item.type === 'thread') {
      const threadItem = THREADS.find((thread) => thread.id === item.id);
      if (!threadItem) return;

      const existingTagIndex = threadTags.findIndex(
        (tag) => tag.id === item.id,
      );
      if (existingTagIndex >= 0) {
        setThreadTags(threadTags.filter((tag) => tag.id !== item.id));
        isUnselecting = true;
      } else {
        setThreadTags([...threadTags, threadItem]);
      }
    } else {
      const modelItem = MODELS.find((model) => model.id === item.id);
      if (!modelItem) return;

      const existingModelIndex = selectedModels.findIndex(
        (model) => model.id === item.id,
      );
      if (existingModelIndex >= 0) {
        setSelectedModels(
          selectedModels.filter((model) => model.id !== item.id),
        );
        isUnselecting = true;
      } else {
        setSelectedModels([...selectedModels, modelItem]);
      }
    }

    const atIndex = inputValue.lastIndexOf('@');
    if (atIndex >= 0) {
      if (isUnselecting) {
        setInputValue(inputValue.substring(0, atIndex));
      } else {
        const beforeMention = inputValue.substring(0, atIndex);
        const afterSearchText = inputValue.substring(
          atIndex + mentionSearch.length + 1,
        );
        setInputValue(`${beforeMention}@${item.name} ${afterSearchText}`);
      }
    }

    setShowMentionPopover(false);
  };

  const filteredMentions = MENTION_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(mentionSearch.toLowerCase()),
  );

  const handleRemoveThreadTag = (tagId: string) => {
    setThreadTags(threadTags.filter((tag) => tag.id !== tagId));
  };

  const handleRemoveModel = (modelId: string) => {
    setSelectedModels(selectedModels.filter((model) => model.id !== modelId));
  };

  const handleFocused = () => {
    setExpanded(true);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handleCancel = useCallback(
    (e: React.MouseEvent | undefined) => {
      setExpanded(false);
      setOpenModalOnExpand(false);
      stickyCommentReset();
      if (isTurnstileEnabled) {
        resetTurnstile();
      }
      onCancel?.(e);
    },
    [onCancel, stickyCommentReset, isTurnstileEnabled, resetTurnstile],
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
            setInputValue(bodyAccumulatedRef.current);
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
            setInputValue(bodyAccumulatedRef.current);
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

    setExpanded(false);
    setOpenModalOnExpand(false);
    stickyCommentReset();

    try {
      const commentId = await handleSubmitComment(turnstileToken);

      if (typeof commentId !== 'number' || isNaN(commentId)) {
        console.error('StickyInput - Invalid comment ID:', commentId);
        throw new Error('Invalid comment ID');
      }

      setInputValue('');
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
    stickyCommentReset,
    isTurnstileEnabled,
    resetTurnstile,
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
    } else if (event.key === 'Escape') {
      if (showMentionPopover) setShowMentionPopover(false);
      if (showModelSelector) setShowModelSelector(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMentionPopover &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowMentionPopover(false);
      }
      if (
        showModelSelector &&
        modelSelectorRef.current &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionPopover, showModelSelector]);

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

  const renderStickyInput = () => {
    const inputContent = (
      <div
        className={`StickyInput ${expanded ? 'expanded' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
        ref={containerRef}
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
                {showMentionPopover && (
                  <div
                    className="mention-dropdown mention-dropdown-above"
                    ref={dropdownRef}
                  >
                    <div className="mention-items">
                      {filteredMentions.length > 0 ? (
                        filteredMentions.map((item) => {
                          const isSelected =
                            (item.type === 'thread' &&
                              threadTags.some((tag) => tag.id === item.id)) ||
                            (item.type === 'model' &&
                              selectedModels.some(
                                (model) => model.id === item.id,
                              ));

                          return (
                            <div
                              key={item.id}
                              className={`mention-item ${item.type} ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleMentionSelect(item)}
                            >
                              <span className="mention-item-text">
                                {item.name}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="mention-empty">No matches found</div>
                      )}
                    </div>
                  </div>
                )}

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
                <button
                  className="image-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick();
                  }}
                  aria-label="Add or Generate Image"
                >
                  <CWIcon iconName="image" iconSize="small" weight="bold" />
                </button>

                <button className="expand-button" onClick={handleFocused}>
                  <CWIcon
                    iconName="arrowsOutSimple"
                    iconSize="small"
                    weight="bold"
                  />
                </button>

                <button
                  className="send-button"
                  onClick={() => customHandleSubmitComment()}
                  disabled={
                    !inputValue.trim() ||
                    (isTurnstileEnabled && !turnstileToken)
                  }
                  aria-label="Send Comment"
                >
                  <CWIcon
                    iconName="paperPlaneTilt"
                    iconSize="small"
                    weight="bold"
                  />
                </button>
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
