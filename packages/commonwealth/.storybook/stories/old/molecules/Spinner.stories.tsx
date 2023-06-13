import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWSpinner } from '../../../../client/scripts/views/components/component_kit/cw_spinner';

const spinner = {
  title: 'Old/Molecules/Spinner',
  component: CWSpinner,
} satisfies Meta<typeof CWSpinner>;

export default spinner;
type Story = StoryObj<typeof spinner>;

export const Spinner: Story = {
  args: {
    size: "xl",
  },
  argTypes: {
    size: {
      control: { type: "radio" },
      options: ["xxs", "xs", "small", "medium", "large", "xl", "xxl"],
    },
  },
  render: ({...args}) => <CWSpinner {...args} />
};
