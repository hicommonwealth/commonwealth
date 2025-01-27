import {
  UseCWRepetitionCycleRadioButtonProps,
  ValidationFnProps,
} from './types';

import { useState } from 'react';
import { RepetitionCycleOption } from './types';

const useCWRepetitionCycleRadioButton = ({
  repetitionCycleInputProps,
  repetitionCycleSelectListProps,
  validatorFn,
}: UseCWRepetitionCycleRadioButtonProps) => {
  const [error, setError] = useState<string>();
  const [cycleInputValue, setCycleInputValue] = useState<
    string | number | undefined
  >(repetitionCycleInputProps?.value);
  const [cycleSelectListValue, setCycleSelectListValue] = useState<
    RepetitionCycleOption | undefined
  >(repetitionCycleSelectListProps.selected);

  const triggerValidation = (props?: ValidationFnProps) => {
    const { error: tempError } = validatorFn({
      values: {
        input: props?.values?.input || cycleInputValue,
        selectList: props?.values?.selectList || cycleSelectListValue,
      },
    });
    setError(tempError);
    return tempError;
  };

  const handleCycleInputValueChange = (value: string | number) => {
    setCycleInputValue(value);
    triggerValidation({ values: { input: value } });
  };

  const handleCycleInputValueBlur = () => {
    if (!cycleInputValue) setCycleInputValue(1);
  };

  const handleCycleSelectListValueChange = (
    selectedValue?: RepetitionCycleOption,
  ) => {
    setCycleSelectListValue(selectedValue);
    triggerValidation({ values: { selectList: selectedValue } });
  };

  return {
    error,
    triggerValidation,
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
