import { CompletionModel } from '@hicommonwealth/shared';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList/CWSelectList';
import React from 'react';
import { CWText } from '../component_kit/cw_text';
import './AIModelSelector.scss';

export interface ModelOption {
  value: CompletionModel;
  label: string;
}

export interface AIModelSelectorProps {
  title: string;
  availableModels: ModelOption[];
  selectedModelValues: CompletionModel[];
  onSelectionChange: (selectedValues: CompletionModel[]) => void;
  maxSelection: number;
  popoverId?: string;
}

export const AIModelSelector = ({
  title,
  availableModels,
  selectedModelValues,
  onSelectionChange,
  maxSelection,
  popoverId,
}: AIModelSelectorProps) => {
  const handleChange = (
    newValue: readonly ModelOption[] | ModelOption | null,
  ) => {
    let newSelectedValues: CompletionModel[] = [];
    if (Array.isArray(newValue)) {
      newSelectedValues = newValue.map((option) => option.value);
    } else if (newValue !== null && 'value' in newValue) {
      newSelectedValues = [newValue.value];
    }

    if (newSelectedValues.length > maxSelection) {
      onSelectionChange(newSelectedValues.slice(0, maxSelection));
    } else {
      onSelectionChange(newSelectedValues);
    }
  };

  // Convert array of selected model values back to array of ModelOption objects for CWSelectList
  const currentValueForSelect = availableModels.filter((model) =>
    selectedModelValues.includes(model.value),
  );

  return (
    <div className="AIModelSelector" id={popoverId}>
      <CWText className="AIModelSelector__title" type="b2">
        {title}
      </CWText>
      <CWSelectList<ModelOption, true>
        isMulti
        options={availableModels}
        value={currentValueForSelect}
        onChange={handleChange}
        placeholder="Select models..."
        className="AIModelSelector__selectList"
        menuPlacement="top"
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
      />
      {selectedModelValues.length >= maxSelection && (
        <p className="AIModelSelector__maxReachedMessage">
          You can select up to {maxSelection} models.
        </p>
      )}
    </div>
  );
};
