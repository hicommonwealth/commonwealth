import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWButton } from '../../../client/scripts/views/components/component_kit/cw_button';
import { notifySuccess } from '../../../client/scripts/controllers/app/notifications';
import { iconLookup } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ undefined, ...Object.keys(iconLookup) ];

const button = {
  title: 'Atoms/Button',
  component: CWButton,
} satisfies Meta<typeof CWButton>;

export default button;
type Story = StoryObj<typeof CWButton>;

const argTypesObj = (options: string[]) => {
  return {
    iconLeft: {
      control: { type: "select" },
      options: iconOptions,
    },
    label: {
      control: { type: "text" },
    },
    buttonType: {
      control: { type: "radio" },
      options: [ ...options ],
    },
    disabled: {
      options: [ true, false ],
    },
  }
}

/** Primary buttons */
export const Primary: Story = {
  args: {
    label: "Primary",
    iconLeft: "person",
    buttonType: "primary-red",
    disabled: false,
  },
  argTypes: argTypesObj([ "primary-red", "primary-blue", "primary-blue-dark", "primary-black" ]),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!')} />
  ),
};

/** Secondary buttons */
export const Secondary: Story = {
  args: {
    label: "Secondary",
    iconLeft: "person",
    buttonType: "secondary-red",
    disabled: false,
  },
  argTypes: argTypesObj([ "secondary-red", "secondary-blue", "secondary-blue-dark", "secondary-black" ]),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Tertiary buttons */
export const Tertiary: Story = {
  args: {
    label: "Tertiary",
    iconLeft: "person",
    buttonType: "tertiary-blue",
    disabled: false,
  },
  argTypes: argTypesObj([ "tertiary-blue", "tertiary-black" ]),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Large primary buttons */
export const LargePrimary: Story = {
  args: {
    label: "Large primary",
    iconLeft: "person",
    buttonType: "lg-primary-red",
    disabled: false,
  },
  argTypes: argTypesObj([ "lg-primary-red", "lg-primary-blue" ]),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Large secondary buttons */
export const LargeSecondary: Story = {
  args: {
    label: "Large secondary",
    iconLeft: "person",
    buttonType: "lg-secondary-red",
    disabled: false,
  },
  argTypes: argTypesObj([ "lg-secondary-red", "lg-secondary-blue" ]),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Large tertiary buttons */
export const LargeTertiary: Story = {
  args: {
    label: "Large tertiary",
    iconLeft: "person",
    buttonType: "lg-tertiary-red",
    disabled: false,
  },
  argTypes: argTypesObj([ "lg-tertiary-red", "lg-tertiary-blue" ]),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Mini buttons */
export const Mini: Story = {
  args: {
    label: "Mini",
    iconLeft: "person",
    buttonType: "mini-black",
    disabled: false,
  },
  argTypes: argTypesObj([ "mini-black", "mini-red", "mini-white" ]),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};
