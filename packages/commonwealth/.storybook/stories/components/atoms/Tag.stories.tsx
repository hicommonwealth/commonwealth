import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWTag } from '../../../../client/scripts/views/components/component_kit/new_designs/CWTag';

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
      options: ["poll", "proposal", "new", "trending", "stage", "spam", "input", "login", "address"]
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
      options: [ "phase-1", "phase-2", "phase-3", "phase-4", "phase-5", "phase-6", "phase-7", "phase-8", "phase-9" ]
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
    type: "stage",
    classNames: 'phase-1'
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
    iconName: "cosmos"
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
    iconName: "cosmos"
  },
  argTypes: argTypesObj(),
  render: ({...args}) => (
    <CWTag {...args} />
  ),
};