import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWCheckbox } from '../../../client/scripts/views/components/component_kit/cw_checkbox';

const checkbox = {
  title: 'Molecules/Checkbox',
  component: CWCheckbox,
} satisfies Meta<typeof CWCheckbox>;

export default checkbox;
type Story = StoryObj<typeof checkbox>;

export const CheckBox: Story = {
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
  render: ({...args}) => <CWCheckbox {...args}>{args.label}</CWCheckbox>
}
