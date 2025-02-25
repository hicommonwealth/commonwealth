import React, { useEffect, useState } from 'react';
import { CWTag } from '../component_kit/new_designs/CWTag';
import {
  MultiSelectOption,
  UpwardMultiSelectList,
} from '../component_kit/new_designs/UpwardMultiSelectList';
import './ChipsAndModelBar.scss';

export type ModelOption = MultiSelectOption;

type ChipsAndModelBarProps = {
  onChipAction: (action: 'summary' | 'question') => void;
  onModelsChange: (models: ModelOption[]) => void;
  selectedModels: ModelOption[];
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
  selectedModels,
}: ChipsAndModelBarProps) => {
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          onModelsChange([claude]);
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
          onModelsChange([fallbackModels[0]]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModels();
  }, [selectedModels.length, onModelsChange]);

  return (
    <div className="ChipsAndModelBar">
      <div className="action-chips">
        <CWTag
          label="Draft Summary"
          onClick={() => onChipAction('summary')}
          type="stage"
        />
        <CWTag
          label="Ask Question"
          onClick={() => onChipAction('question')}
          type="stage"
        />
      </div>

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
          onChange={onModelsChange}
          value={selectedModels}
          menuPlacement="top"
        />
      </div>
    </div>
  );
};
