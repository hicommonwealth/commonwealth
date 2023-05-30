import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWButton } from '../../../client/scripts/views/components/component_kit/new_designs/cw_button';
import { notifySuccess } from '../../../client/scripts/controllers/app/notifications';
import { iconLookup } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ undefined, ...Object.keys(iconLookup) ];

const button = {
  title: 'Atoms/Button',
  component: CWButton,
} satisfies Meta<typeof CWButton>;

export default button;
type Story = StoryObj<typeof CWButton>;

const argTypesObj = () => {
  return {
    buttonType: {
      control: { type: "inline-radio" },
      options: ["primary", "secondary", "tertiary", "destructive"]
    },
    iconLeft: {
      control: { type: "select" },
      options: iconOptions,
    },
    iconRight: {
      control: { type: "select" },
      options: iconOptions,
    },
    label: {
      control: { type: "text" },
    },
    buttonHeight: {
      control: { type: "inline-radio" },
      options: ['lg', 'med', 'sm']
    },
    buttonWidth: {
      control: { type: "inline-radio" },
      options: ["narrow", "wide"]
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
    iconRight: undefined,
    buttonType: "primary",
    buttonWidth: "narrow",
    buttonHeight: "med",
    disabled: false,
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!')} />
  ),
};

/** Secondary buttons */
export const Secondary: Story = {
  args: {
    label: "Secondary",
    iconLeft: "person",
    iconRight: undefined,
    buttonType: "secondary",
    buttonWidth: "narrow",
    buttonHeight: "med",
    disabled: false,
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Tertiary buttons */
export const Tertiary: Story = {
  args: {
    label: "Tertiary",
    iconLeft: "person",
    iconRight: undefined,
    buttonType: "tertiary",
    buttonWidth: "narrow",
    buttonHeight: "med",
    disabled: false,
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Destructive buttons */
export const Destructive: Story = {
  args: {
    label: "Destructive",
    iconLeft: "person",
    iconRight: undefined,
    buttonType: "destructive",
    buttonWidth: "narrow",
    buttonHeight: "med",
    disabled: false,
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};
