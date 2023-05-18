import React, { FC } from 'react';
import type { Meta } from "@storybook/react";

import { PopoverMenu, PopoverMenuItem } from '../../../client/scripts/views/components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../../client/scripts/views/components/component_kit/cw_icon_button';
import { iconLookup, IconName } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ ...Object.keys(iconLookup) ];

const popoverMenu = {
  title: 'Organisms/Popover Menu',
  component: PopoverMenu,
} satisfies Meta<typeof PopoverMenu>;

export default popoverMenu;

interface PopoverProps {
  header1: string;
  header2: string;
  label1: string;
  label2: string;
  label3: string;
  bottom: string;
  iconLabel1: IconName;
  iconLabel2: IconName;
  iconLabel3: IconName;
  iconBottom: IconName;
};

const popoverMenuOptions = (options: PopoverProps): Array<PopoverMenuItem> => {
  return [
    { type: 'header', label: options.header1 },
    {
      type: 'default',
      label: options.label1,
      iconLeft: options.iconLabel1,
      onClick: () => console.log('Create thread clicked'),
    },
    {
      label: options.label2,
      iconLeft: options.iconLabel2,
      disabled: true,
      onClick: () => console.log('Create snapshot clicked'),
    },
    { type: 'divider' },
    { type: 'header', label: options.header2 },
    {
      label: options.label3,
      iconLeft: options.iconLabel3,
      onClick: () => console.log('Create community clicked'),
    },
    { type: 'divider' },
    {
      label: options.bottom,
      iconLeft: options.iconBottom,
      isSecondary: true,
      onClick: () => console.log('Report clicked'),
    },
  ];
};

const Popover: FC<PopoverProps> = (props) => {
  return (
    <PopoverMenu
      menuItems={popoverMenuOptions(props)}
      renderTrigger={(onclick: any) => (
        <CWIconButton iconName="plusCircle" onClick={onclick} />
      )}
    />
  );
};

export const PopoverMenuStory = {
  name: 'Popover Menu',
  args: {
    header1: "Community",
    label1: "Create Thread",
    iconLabel1: "write",
    label2: "Create Snapshot",
    iconLabel2: "write",
    header2: "Universal",
    label3: "Create Community",
    iconLabel3: "people",
    bottom: "Report",
    iconBottom: "cautionCircle",
  },
  argTypes: {
    header1: {
      control: { type: "text" }
    },
    header2: {
      control: { type: "text" }
    },
    label1: {
      control: { type: "text" }
    },
    label2: {
      control: { type: "text" }
    },
    label3: {
      control: { type: "text" }
    },
    iconLabel1: {
      control: { type: "select" },
      options: iconOptions,
    },
    iconLabel2: {
      control: { type: "select" },
      options: iconOptions,
    },
    iconLabel3: {
      control: { type: "select" },
      options: iconOptions,
    },
    bottom: {
      control: { type: "text" }
    },
    iconBottom: {
      control: { type: "select" },
      options: iconOptions,
    },
  },
  parameters: {
    controls: {
      exclude: [
        "menuItems",
        "renderTrigger",
      ],
    }
  },
  render: ({...args}) => (
    <Popover
      header1={args.header1}
      header2={args.header2}
      label1={args.label1}
      label2={args.label2}
      label3={args.label3}
      bottom={args.bottom}
      iconLabel1={args.iconLabel1}
      iconLabel2={args.iconLabel2}
      iconLabel3={args.iconLabel3}
      iconBottom={args.iconBottom}
    />
  )
};
