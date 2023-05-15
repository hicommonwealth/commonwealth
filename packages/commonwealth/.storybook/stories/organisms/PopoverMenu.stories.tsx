import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  PopoverMenu,
  PopoverMenuItem,
} from '../../../client/scripts/views/components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../../client/scripts/views/components/component_kit/cw_icon_button';

const popoverMenu = {
  title: 'Organisms/Popover Menu',
  component: PopoverMenu,
} satisfies Meta<typeof PopoverMenu>;

export default popoverMenu;
// type Story = StoryObj<typeof popoverMenu>;

const popoverMenuOptions = (): Array<PopoverMenuItem> => {
  return [
    { type: 'header', label: 'Community' },
    {
      type: 'default',
      label: 'Create Thread',
      iconLeft: 'write',
      onClick: () => console.log('Create thread clicked'),
    },
    {
      label: 'Create Proposal',
      iconLeft: 'write',
      onClick: () => console.log('Create proposal clicked'),
    },
    {
      label: 'Create Poll',
      iconLeft: 'write',
      onClick: () => console.log('Create poll clicked'),
    },
    {
      label: 'Create Snapshot',
      iconLeft: 'write',
      disabled: true,
      onClick: () => console.log('Create snapshot clicked'),
    },
    { type: 'divider' },
    { type: 'header', label: 'Universal' },
    {
      label: 'Create Community',
      iconLeft: 'people',
      onClick: () => console.log('Create community clicked'),
    },
    {
      label: 'Create Crowdfund',
      iconLeft: 'wallet',
      onClick: () => console.log('Create crowdfund clicked'),
    },
    { type: 'divider' },
    {
      label: 'Report',
      iconLeft: 'cautionCircle',
      isSecondary: true,
      onClick: () => console.log('Report clicked'),
    },
  ];
};

// export const PopoverMenuStory: Story = {
export const PopoverMenuStory = {
  name: 'Popover Menu',
  render: () => (
    <PopoverMenu
      menuItems={popoverMenuOptions()}
      renderTrigger={(onclick: any) => (
        <CWIconButton iconName="plusCircle" onClick={onclick} />
      )}
    />
  ),
};
