import React, { FC, useEffect, useState } from 'react';
import type { Meta } from '@storybook/react';

import { CWRadioButton } from '../../../client/scripts/views/components/component_kit/new_designs/cw_radio_button';

const radioButton = {
  title: 'Components/RadioButton',
  component: CWRadioButton,
} satisfies Meta<typeof CWRadioButton>;

export default radioButton;

interface RadioButtonProps {
  checked: boolean;
  disabled: boolean;
  value: string;
  onChange?: (e?: any) => void;
};

const RadioButton: FC<RadioButtonProps> = (props) => {
  const { checked, disabled, value, onChange } = props;
  const [isChecked, setIsChecked] = useState<boolean | undefined>(checked);
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(disabled);

  useEffect(() => setIsChecked(checked), [checked]);
  useEffect(() => setIsDisabled(disabled), [disabled]);

  return (
    <CWRadioButton
      checked={isChecked}
      disabled={isDisabled}
      value={value}
      onChange={onChange}
    />
  );
}

const Base = (checked: boolean, disabled: boolean) => {
  return {
    args: {
      value: "Yes",
      checked: checked,
      onChange: (e?: any) => console.log('Testing onChange as props', e),
    },
    argTypes: {
      value: {
        control: { type: "text" },
      },
      checked: {
        control: { type: "boolean" },
        options: [ true, false ],
      },
    },
    parameters: {
      controls: {
        exclude: [
          "label",
          "groupName",
          "onChange",
          "disabled",
          disabled ? "checked" : null,
        ]
      }
    },
    render: ({...args}) => (
      <RadioButton
        value={args.value}
        disabled={disabled}
        checked={args.checked}
        onChange={args.onChange}
      />
    ),
  };
}

export const Overview = { ...Base(false, false) };
export const DisabledUnchecked = { ...Base(false, true) };
export const DisabledChecked = { ...Base(true, true) };
