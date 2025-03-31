import React, { useEffect, useRef, useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import CWTextInput from 'views/components/component_kit/new_designs/CWTextInput/CWTextInput';
import './StickyInput.scss';
import { MENTION_ITEMS, ModelItem, MODELS, ThreadItem, THREADS } from './utils';

export type ThreadMentionTagType = 'threadMention' | 'modelMention';

const StickyInput = () => {
  const [inputValue, setInputValue] = useState('');
  const [threadTags, setThreadTags] = useState<ThreadItem[]>([]);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelItem[]>([
    MODELS[0], // Claude 3.7 Sonnet is default
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showMentionPopover) setShowMentionPopover(false);
        if (showModelSelector) setShowModelSelector(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMentionPopover, showModelSelector]);

  return (
    <div className="StickyInput" ref={containerRef}>
      {threadTags.length > 0 && (
        <div className="thread-tags-container">
          <div className="tags-row">
            {threadTags.map((tag) => (
              <CWTag
                key={tag.id}
                type="pill"
                label={tag.label}
                trimAt={20}
                onCloseClick={() => handleRemoveThreadTag(tag.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action tags - static buttons */}
      <div className="action-tags-container">
        <div className="tags-row">
          <CWTag
            key="summarize"
            type="pill"
            classNames="action-pill"
            label="Summarize thread"
            onClick={() => console.log('Summarize thread clicked')}
          />
          <CWTag
            key="generate"
            type="pill"
            classNames="action-pill"
            label="Generate replies"
            onClick={() => console.log('Generate replies clicked')}
          />
          <CWTag
            key="draft"
            type="pill"
            classNames="action-pill"
            label="Draft response"
            onClick={() => console.log('Draft response clicked')}
          />
        </div>
      </div>

      {/* Input row */}
      <div className="input-row">
        <div className="text-input-container">
          {/* Mention popover - appears above input */}
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
                        selectedModels.some((model) => model.id === item.id));

                    return (
                      <div
                        key={item.id}
                        className={`mention-item ${item.type} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleMentionSelect(item)}
                      >
                        <span className="mention-item-text">{item.name}</span>
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
            placeholder="Create thread or mention a model..."
          />
        </div>

        {/* Model selector */}
        <div className="model-selector" ref={modelSelectorRef}>
          <button
            className="model-selector-button"
            onClick={() => setShowModelSelector(!showModelSelector)}
          >
            {selectedModels.length === 0 ? (
              <CWIcon iconName="starFour" iconSize="small" weight="bold" />
            ) : (
              <>
                <CWIcon iconName="starFour" iconSize="small" weight="bold" />
                <span className="model-name">{selectedModels[0].label}</span>
                {selectedModels.length > 1 && (
                  <span className="model-count">
                    +{selectedModels.length - 1}
                  </span>
                )}
              </>
            )}
          </button>
          {showModelSelector && (
            <div className="mention-dropdown mention-dropdown-above model-selector-dropdown">
              <div className="mention-items">
                {MODELS.map((model) => {
                  const isSelected = selectedModels.some(
                    (m) => m.id === model.id,
                  );
                  return (
                    <div
                      key={model.id}
                      className={`mention-item model ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        const existingModelIndex = selectedModels.findIndex(
                          (m) => m.id === model.id,
                        );
                        if (existingModelIndex >= 0) {
                          handleRemoveModel(model.id);
                        } else {
                          setSelectedModels([...selectedModels, model]);
                        }
                      }}
                    >
                      <span className="mention-item-text">{model.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Send button */}
        <button className="send-button">
          <CWIcon iconName="paperPlaneTilt" iconSize="small" weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default StickyInput;
