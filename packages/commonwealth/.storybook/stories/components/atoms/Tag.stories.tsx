import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWTag } from '../../../../client/scripts/views/components/component_kit/new_designs/cw_tag';
// import { notifySuccess } from '../../../../client/scripts/controllers/app/notifications';
import { iconLookup } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ undefined, ...Object.keys(iconLookup) ];

const tag = {
  title: 'Components/Tag',
  component: CWTag,
} satisfies Meta<typeof CWTag>;

export default tag;
type Story = StoryObj<typeof CWTag>;

const argTypesObj = () => {
  return {
    type: {
      control: { type: "inline-radio" },
      options: ["poll", "proposal", "new", "trending", "stage", "spam", "new-stage", "input", "login", "address"]
    },
    label: {
      control: { type: "text" },
    },
    iconName: {
      control: { type: "inline-radio" },
      options: ['newStar', 'trendUp']
    },
    loginIcon: {
      control: { type: "text" },
      options: ['cosmos', 'discordLogin', 'envelope', 'ethereum', 'octocat', 'near', 'polkadot', 'polygon', 'twitternew']
    },
  }
}

const commonParameters = {
  parameters: {
    controls: { exclude: ["className"] },
  },
};

/** Primary buttons */
export const Status: Story = {
  args: {
    label: "Status",
    type: "proposal"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

/** Secondary buttons */
export const Spam: Story = {
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
    <CWTag {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Tertiary buttons */
export const Elements: Story = {
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
    <CWTag {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Tertiary buttons */
export const Stage: Story = {
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
    <CWTag {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Tertiary buttons */
export const Proposal: Story = {
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
    <CWTag {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Destructive buttons */
export const Input: Story = {
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
    <CWTag {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Tertiary buttons */
export const Address: Story = {
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
    <CWTag {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};

/** Tertiary buttons */
export const Login: Story = {
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
    <CWTag {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};