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
      control: { type: "select" },
      options: ['', 'newStar', 'trendUp']
    },
    loginIcon: {
      control: { type: "select" },
      options: ['cosmos', 'discordLogin', 'envelope', 'ethereum', 'octocat', 'near', 'polkadot', 'polygon', 'twitterNew']
    },
    classNames: {
      control: { type: "inline-radio" },
      options: [ "rorange-600", "rorange-400", "yellow-500", "green-600", "green-500", "primary-600", "primary-400", "purple-600", "purple-400" ]
    }
  }
}

const commonParameters = {
  parameters: {
    controls: { exclude: ["className"] },
  },
};

/** Status tags */
export const New: Story = {
  args: {
    label: "New",
    type: "new",
    iconName:"newStar"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

export const Trending: Story = {
  args: {
    label: "Trending",
    type: "trending",
    iconName:"trendUp"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

/** Spam tag */
export const Spam: Story = {
  args: {
    label: "SPAM",
    type: "spam"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

/** Elements tags */
export const Poll: Story = {
  args: {
    label: "Poll",
    type: "poll"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

export const Snapshot: Story = {
  args: {
    label: "Snapshot",
    type: "active"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

/** New stages tags*/
export const Stages: Story = {
  args: {
    label: "Stage 1",
    type: "new-stage",
    classNames: 'rorange-600'
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

/** Proposal tag*/
export const Proposal: Story = {
  args: {
    label: "Proposal",
    type: "proposal"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

/** Login tags*/
export const Login: Story = {
  args: {
    label: "mnh7a",
    type: "login",
    loginIcon: "cosmos"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};

/** Address tags*/
export const Address: Story = {
  args: {
    label: "0xd83e1...a39bD",
    type: "address",
    loginIcon: "cosmos"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};