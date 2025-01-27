import { UseCWRepetitionCycleRadioButtonProps } from './types';

import { useState } from 'react';
import { RepetitionCycleOption } from './types';

const useCWRepetitionCycleRadioButton = ({
  repetitionCycleInputProps,
  repetitionCycleSelectListProps,
}: UseCWRepetitionCycleRadioButtonProps) => {
  const [cycleInputValue, setCycleInputValue] = useState<
    string | number | undefined
  >(repetitionCycleInputProps?.value);
  const [cycleSelectListValue, setCycleSelectListValue] = useState<
    RepetitionCycleOption | undefined
  >(repetitionCycleSelectListProps.selected);

  const handleCycleInputValueChange = (value: string | number) => {
    setCycleInputValue(value);
  };

  const handleCycleInputValueBlur = () => {
    if (!cycleInputValue) setCycleInputValue(1);
  };

  const handleCycleSelectListValueChange = (
    selectedValue?: RepetitionCycleOption,
  ) => {
    setCycleSelectListValue(selectedValue);
  };

  return {
    repetitionCycleInputProps: {
      value: cycleInputValue,
      placeholder: repetitionCycleInputProps?.placeholder,
      onChange: handleCycleInputValueChange,
      onBlur: handleCycleInputValueBlur,
      isDisabled: false,
      hasError: false,
    },
    repetitionCycleSelectListProps: {
      options: repetitionCycleSelectListProps.options,
      placeholder: repetitionCycleSelectListProps.placeholder,
      onChange: handleCycleSelectListValueChange,
      selected: cycleSelectListValue,
      isDisabled: false,
      hasError: false,
    },
  };
};

export default useCWRepetitionCycleRadioButton;
