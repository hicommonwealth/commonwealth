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
  ReturnType<typeof useCWRepetitionCycleRadioButton>;

export type UseCWRepetitionCycleRadioButtonProps = {
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
