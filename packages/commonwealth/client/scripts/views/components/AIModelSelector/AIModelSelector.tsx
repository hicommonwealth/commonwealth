import { CompletionModel } from '@hicommonwealth/shared';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList/CWSelectList';
import React from 'react';
import { CWText } from '../component_kit/cw_text';
import './AIModelSelector.scss';

// Define the shape of model options, compatible with CWSelectList
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
  popoverId?: string; // For ARIA attributes if needed by the popover trigger
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
    // actionMeta: ActionMeta<ModelOption> // Available if needed
  ) => {
    let newSelectedValues: CompletionModel[] = [];
    if (Array.isArray(newValue)) {
      newSelectedValues = newValue.map((option) => option.value);
    } else if (newValue !== null && 'value' in newValue) {
      // Should be an array if isMulti is true, but handle single object defensively
      newSelectedValues = [newValue.value];
    }

    if (newSelectedValues.length > maxSelection) {
      // Silently cap the selection at maxSelection
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
    <div
      className="AIModelSelector"
      id={popoverId}
      role="dialog" // Assuming this component acts as a dialog within a popover
      aria-modal="false" // If it doesn't trap focus like a modal
      aria-label={title}
    >
      <CWText className="AIModelSelector__title" type="b2">
        {title}
      </CWText>
      <CWSelectList<ModelOption, true> // Explicitly type Option as ModelOption and IsMulti as true
        isMulti
        options={availableModels}
        value={currentValueForSelect}
        onChange={handleChange}
        placeholder="Select models..."
        className="AIModelSelector__selectList"
        menuPlacement="top"
        closeMenuOnSelect={false} // Keep menu open for easier multi-selection
        hideSelectedOptions={false} // Continue to show selected options in the list
        // components={{ Option: CustomOptionWithCheckbox }} // Future: Add if checkboxes are desired
      />
      {selectedModelValues.length >= maxSelection && (
        <p className="AIModelSelector__maxReachedMessage">
          You can select up to {maxSelection} models.
        </p>
      )}
    </div>
  );
};
