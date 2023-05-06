import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWCheckbox } from '../../../client/scripts/views/components/component_kit/cw_checkbox';

const checkbox = {
  title: 'Molecules/Checkbox',
  component: CWCheckbox,
} satisfies Meta<typeof CWCheckbox>;

export default checkbox;
type Story = StoryObj<typeof checkbox>;

const CheckBox = () => {
  const [isCheckboxChecked, setIsCheckboxChecked] = useState<boolean>(false);

  return (
    <CWCheckbox
      checked={isCheckboxChecked}
      label="Click me"
      onChange={() => {
        setIsCheckboxChecked(!isCheckboxChecked);
      }}
    />
  );
}

export const ClickMe: Story = {
  name: 'Click me',
  render: () => <CheckBox />
}

export const Disabled: Story = {
  name: 'Disabled',
  render: () => <CWCheckbox label="Disabled" disabled />
}

export const CheckedAndDisabled: Story = {
  name: 'Checked and disabled',
  render: () => <CWCheckbox label="Checked and disabled" disabled checked />
}

export const Indeterminate: Story = {
  name: 'Indeterminate',
  render: () => <CWCheckbox label="Indeterminate" indeterminate />
}

export const IndeterminateAndDisabled: Story = {
  name: 'Indeterminate and disabled',
  render: () => <CWCheckbox label="Indeterminate and disabled" disabled indeterminate />
}
