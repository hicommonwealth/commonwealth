import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTag } from '../../../client/scripts/views/components/component_kit/cw_tag';
import { iconLookup } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ undefined, ...Object.keys(iconLookup) ];

const tag = {
  title: 'Molecules/Tag',
  component: CWTag,
} satisfies Meta<typeof CWTag>;

export default tag;
type Story = StoryObj<typeof tag>;

export const Tag: Story = {
  args: {
    label: "Ref #90",
    type: "active",
    iconName: undefined,
  },
  argTypes: {
    label: {
      control: { type: "text" },
    },
    type: {
      control: { type: "radio" },
    },
    iconName: {
      control: { type: "select" },
      options: iconOptions,
    },
  },
  render: ({...args}) => <CWTag {...args} />
};
