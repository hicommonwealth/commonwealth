import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWIcon } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon';
import '../../../../client/styles/components/component_kit/cw_component_showcase.scss';
import type { IconName } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';
import { iconLookup } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const icons = {
  title: 'Atoms/Icons',
  component: CWIcon,
} satisfies Meta<typeof CWIcon>;

export default icons;
// type Story = StoryObj<typeof allIcons>;

const displayIcons = (icons) => {
  return Object.entries(icons).map(([k], i) => {
    return (
      <div className="icon-container" key={i}>
        <div className="icon-name">{k}</div>
        <CWIcon iconName={k as IconName} />
      </div>
    );
  });
};

const Icons = () => {
  return (
    <div className="all-icons-container">{displayIcons(iconLookup)}</div>
  )
}

// export const AllIcons: Story = {
export const AllIcons = {
  name: 'Icons',
  render: () => <Icons />
}
