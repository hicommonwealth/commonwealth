import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWRadioButton } from '../../../client/scripts/views/components/component_kit/cw_radio_button';

const radioButton = {
  title: 'Molecules/RadioButton',
  component: CWRadioButton,
} satisfies Meta<typeof CWRadioButton>;

export default radioButton;
// type Story = StoryObj<typeof radioButton>;

interface RadiobuttonProps {
  value: string,
  checked?: boolean,
  disabled?: boolean,
}

const Radiobutton: FC<RadiobuttonProps> = ({value, checked, disabled}) => {
  const [isRadioButtonChecked, setIsRadioButtonChecked] =
    useState<boolean>(false);

  return (
    <CWRadioButton
      value={value}
      label={value}
      disabled={disabled}
      checked={isRadioButtonChecked === true || checked}
      onChange={() => {
        setIsRadioButtonChecked(true);
      }}
    />
  )
}

// export const ProgressBarSuccess: Story = {
export const RadioButton = {
  name: 'Radio Button',
  render: () => <Radiobutton value="Radio Button" />
}

export const DisabledRadioButton = {
  name: 'Disabled Radio Button',
  render: () => (
    <Radiobutton
      value="Disabled Radio Button"
      disabled
    />
  )
}

export const CheckedAndDisabledRadioButton = {
  name: 'Checked and Disabled Radio Button',
  render: () => (
    <Radiobutton
      value="Checked and Disabled Radio Button"
      disabled
      checked
    />
  )
}

