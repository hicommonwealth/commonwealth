import React, { useEffect, useState } from 'react';
import { useLocalAISettingsStore } from 'state/ui/user/localAISettings';
import { CWButton } from '../component_kit/new_designs/CWButton';
import {
  MultiSelectOption,
  UpwardMultiSelectList,
} from '../component_kit/new_designs/UpwardMultiSelectList';
import './ChipsAndModelBar.scss';

export type ModelOption = MultiSelectOption;

export type ChipsContext = {
  isReplyingToComment: boolean;
  commentId?: number;
  threadId?: number;
  authorName?: string;
  threadBody?: string;
  threadTitle?: string;
};

type ChipsAndModelBarProps = {
  onChipAction: (
    action: 'summary' | 'question' | 'draft' | 'generate-replies',
  ) => void;
  onModelsChange?: (models: ModelOption[]) => void;
  selectedModels?: ModelOption[];
  context: ChipsContext;
};

// Truncate model descriptions to keep them reasonable
const truncateDescription = (
  description?: string,
  maxLength = 150,
): string | undefined => {
  if (!description) return undefined;
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
};

export const ChipsAndModelBar = ({
  onChipAction,
  onModelsChange,
  selectedModels: externalSelectedModels,
  context,
}: ChipsAndModelBarProps) => {
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure context has default values to prevent undefined errors
  const safeContext = {
    isReplyingToComment: context?.isReplyingToComment || false,
    commentId: context?.commentId,
    threadId: context?.threadId,
    authorName: context?.authorName || '',
    threadBody: context?.threadBody || '',
    threadTitle: context?.threadTitle || '',
  };

  // Use the persisted models from the store
  const { selectedModels: storedModels, setSelectedModels } =
    useLocalAISettingsStore();

  // Determine which models to use - external props or stored models
  const selectedModels = externalSelectedModels || storedModels;

  // Handle model changes
  const handleModelsChange = (models: ModelOption[]) => {
    // Update the store
    setSelectedModels(models);
    // Also call the external handler if provided
    onModelsChange?.(models);
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();

        // Process and clean up model data
        const options = data.data
          .map((model: any) => ({
            value: model.id,
            label: model.name,
            description: truncateDescription(model.description),
            pricing: model.pricing,
          }))
          .sort((a: ModelOption, b: ModelOption) =>
            a.label.localeCompare(b.label),
          );

        setModelOptions(options);

        // Pre-select Claude if available and no models are already selected
        const claude = options.find(
          (m) => m.value === 'anthropic/claude-3.5-sonnet',
        );
        if (claude && selectedModels.length === 0) {
          handleModelsChange([claude]);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Provide some fallback models in case the API fails
        const fallbackModels = [
          {
            value: 'anthropic/claude-3.5-sonnet',
            label: 'Claude 3.5 Sonnet',
            description:
              'Fast, affordable AI assistant with strong performance across tasks.',
          },
          {
            value: 'anthropic/claude-3-haiku',
            label: 'Claude 3 Haiku',
            description:
              "Anthropic's fastest and most compact model for simple tasks.",
          },
          {
            value: 'openai/gpt-4',
            label: 'GPT-4',
            description:
              "OpenAI's most advanced model, capable of solving complex problems with high accuracy.",
          },
        ];
        setModelOptions(fallbackModels);

        if (selectedModels.length === 0) {
          handleModelsChange([fallbackModels[0]]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModels();
  }, []);

  // Determine what chips to show based on context
  const { isReplyingToComment, authorName } = safeContext;
  const replyingToText = authorName ? ` to ${authorName}` : '';

  return (
    <div className="ChipsAndModelBar">
      {/* Model selector on top */}
      <div className="model-selector">
        <UpwardMultiSelectList
          options={modelOptions}
          defaultValue={modelOptions[0] || { value: '', label: '' }}
          placeholder={
            selectedModels.length
              ? 'Add another model...'
              : 'Select AI Models...'
          }
          isDisabled={isLoading}
          onChange={handleModelsChange}
          value={selectedModels}
          menuPlacement="top"
        />
      </div>

      {/* Action buttons below */}
      <div className="action-chips">
        <CWButton
          label="Summarize Thread"
          buttonType="secondary"
          buttonHeight="sm"
          iconLeft="bookOpenText"
          onClick={() => {
            console.log('Action: Summarize Thread');
            onChipAction('summary');
          }}
        />

        {isReplyingToComment ? (
          <>
            <CWButton
              label={`Draft Reply${replyingToText}`}
              buttonType="secondary"
              buttonHeight="sm"
              iconLeft="notePencil"
              onClick={() => {
                console.log('Action: Draft Reply');
                onChipAction('draft');
              }}
            />
            <CWButton
              label={`Generate Replies${replyingToText}`}
              buttonType="secondary"
              buttonHeight="sm"
              iconLeft="sparkle"
              onClick={() => {
                console.log('Action: Generate Replies');
                onChipAction('generate-replies');
              }}
            />
          </>
        ) : (
          <>
            <CWButton
              label="Draft Response"
              buttonType="secondary"
              buttonHeight="sm"
              iconLeft="notePencil"
              onClick={() => {
                console.log('Action: Draft Response');
                onChipAction('draft');
              }}
            />
            <CWButton
              label="Generate Thread Replies"
              buttonType="secondary"
              buttonHeight="sm"
              iconLeft="sparkle"
              onClick={() => {
                console.log('Action: Generate Thread Replies');
                onChipAction('generate-replies');
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
