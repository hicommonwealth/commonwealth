import { RadioButtonProps } from 'views/components/component_kit/new_designs/cw_radio_button';
import useCWRepetitionCycleRadioButton from './useCWRepetitionCycleRadioButton';

export type RepetitionCycleOption = {
  label: string;
  value: string | number;
};

export type CWRepetitionCycleRadioButtonProps = Omit<
  RadioButtonProps,
  'label' | 'hideLabels'
> &
  Omit<
    ReturnType<typeof useCWRepetitionCycleRadioButton>,
    'error' | 'triggerValidation'
  > & {
    customError?: string;
  };

export type ValidationFnProps = {
  values: {
    input?: string | number;
    selectList?: RepetitionCycleOption;
  };
};

export type UseCWRepetitionCycleRadioButtonProps = {
  validatorFn: (props: ValidationFnProps) => { error?: string };
  repetitionCycleSelectListProps: {
    options: RepetitionCycleOption[];
    selected?: RepetitionCycleOption;
    placeholder?: string;
  };
  repetitionCycleInputProps?: {
    value?: number;
    placeholder?: string;
  };
};
