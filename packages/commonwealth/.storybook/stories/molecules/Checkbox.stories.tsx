import React, { FC, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWCheckbox } from '../../../client/scripts/views/components/component_kit/cw_checkbox';

const checkbox = {
  title: 'Molecules/Checkbox',
  component: CWCheckbox,
} satisfies Meta<typeof CWCheckbox>;

export default checkbox;

interface CheckboxProps {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
  label: string;
};

const Checkbox: FC<CheckboxProps> = (props) => {
  const { checked, disabled, label, indeterminate } = props;
  const [isChecked, setIsChecked] = useState<boolean | undefined>(checked);
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(disabled);
  const [isIndeterminate, setIsIndeterminate] = useState<boolean | undefined>(indeterminate);

  useEffect(() => setIsChecked(checked), [checked]);
  useEffect(() => setIsDisabled(disabled), [disabled]);
  useEffect(() => setIsIndeterminate(indeterminate), [indeterminate]);

  return (
    <CWCheckbox
      checked={isChecked}
      disabled={isDisabled}
      indeterminate={isIndeterminate}
      label={label}
      onChange={(e) => {
        setIsChecked(!isChecked);
        e.stopPropagation();
      }}
    />
  );
}

export const CheckboxStory = {
  name: "Checkbox",
  args: {
    label: "Click me",
    disabled: false,
    checked: false,
    indeterminate: false,
  },
  argTypes: {
    label: {
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
    indeterminate: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
  },
  parameters: {
    controls: {
      exclude: [
        "className",
        "groupName",
        "value",
        "onChange",
      ],
    },
  },
  render: ({...args}) => (
    <Checkbox
      label={args.label}
      disabled={args.disabled}
      checked={args.checked}
      indeterminate={args.indeterminate}
    />
  ),
}
