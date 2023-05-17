import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWRadioButton } from '../../../client/scripts/views/components/component_kit/cw_radio_button';

const radioButton = {
  title: 'Molecules/RadioButton',
  component: CWRadioButton,
} satisfies Meta<typeof CWRadioButton>;

export default radioButton;
type Story = StoryObj<typeof radioButton>;

export const RadioButton: Story = {
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
    controls: { exclude: ["label", "groupName"] }
  },
  render: ({...args}) => <CWRadioButton {...args}/>
}
