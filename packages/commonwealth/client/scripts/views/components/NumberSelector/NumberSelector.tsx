import React from 'react';

import CWCircleButton from 'views/components/component_kit/new_designs/CWCircleButton';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import './NumberSelector.scss';

interface NumberSelectorProps {
  onMinusClick: () => void;
  minusDisabled: boolean;
  onPlusClick: () => void;
  plusDisabled?: boolean;
  onInput: (e) => void;
  value: string | number;
  inputClassName?: string;
  inputDisabled?: boolean;
}

const NumberSelector = ({
  onMinusClick,
  minusDisabled,
  onPlusClick,
  plusDisabled,
  onInput,
  value,
  inputClassName,
  inputDisabled,
}: NumberSelectorProps) => {
  return (
    <div className="NumberSelector">
      <CWCircleButton
        buttonType="secondary"
        iconName="minus"
        onClick={onMinusClick}
        disabled={minusDisabled}
      />
      <CWTextInput
        onInput={onInput}
        value={value}
        containerClassName="number-container"
        inputClassName={inputClassName}
        disabled={inputDisabled}
      />
      <CWCircleButton
        buttonType="secondary"
        iconName="plus"
        onClick={onPlusClick}
        disabled={plusDisabled}
      />
    </div>
  );
};

export default NumberSelector;
