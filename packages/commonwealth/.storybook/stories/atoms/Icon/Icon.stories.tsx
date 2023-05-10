import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWIcon } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon';
import type { IconName } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';
import { iconLookup } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

import '../../../../client/styles/components/component_kit/cw_component_showcase.scss';

const iconOptions = [ ...Object.keys(iconLookup) ];

const icons = {
  title: 'Atoms/Icon/Overview',
  component: CWIcon,
} satisfies Meta<typeof CWIcon>;

export default icons;
type Story = StoryObj<typeof icons>;

export const Icon: Story = {
  name: "Overview",
  args: {
    iconName: "arrowLeft",
  },
  argTypes: {
    iconName: {
      control: { type: "select" },
      options: iconOptions,
    },
  },
  render: ({...args}) => (
    <div className="icon-container">
      <div className="icon-name">{args.iconName}</div>
      <CWIcon iconName={args.iconName as IconName} />
    </div>
  ),
}
