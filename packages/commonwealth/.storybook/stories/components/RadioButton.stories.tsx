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
};

const RadioButton: FC<RadioButtonProps> = (props) => {
  const { checked, disabled, value } = props;
  const [isChecked, setIsChecked] = useState<boolean | undefined>(checked);
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(disabled);

  useEffect(() => setIsChecked(checked), [checked]);
  useEffect(() => setIsDisabled(disabled), [disabled]);

  return (
    <CWRadioButton
      checked={isChecked}
      disabled={isDisabled}
      value={value}
      onChange={(e) => {
        setIsChecked(!isChecked);
        e.stopPropagation();
      }}
    />
  );
}

export const RadioButtonStory = {
  name: "RadioButton",
  args: {
    value: "Radio Button",
    disabled: false,
    checked: false,
  },
  argTypes: {
    value: {
      control: { type: "text" },
    },
    disabled: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    checked: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
  },
  parameters: {
    controls: { exclude: ["label", "groupName", "onChange"] }
  },
  render: ({...args}) => (
    <RadioButton
      value={args.value}
      disabled={args.disabled}
      checked={args.checked}
    />
  ),
}
