import React, { FC, useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWThreadAction } from "../../../client/scripts/views/components/component_kit/new_designs/cw_thread_action";
import type { ActionType } from "../../../client/scripts/views/components/component_kit/new_designs/cw_thread_action";

const threadActions = {
  title: "Components/Thread Actions/Actions",
  component: CWThreadAction,
} satisfies Meta<typeof CWThreadAction>;

export default threadActions;
type Story = StoryObj<typeof threadActions>;

const BaseStory = (action: ActionType) => {
  return {
    args: {
      disabled: false,
    },
    parameters: {
      controls: {
        exclude: [
          "action",
          "count",
          "onClick",
        ],
      },
    },
    render: ({...args}) => (
      <CWThreadAction
        action={action}
        onClick={() => console.log(`${action} action clicked!`)}
        disabled={args.disabled}
      />
    ),
  };
};

export const Comment: Story = { ...BaseStory("comment") };
export const Share: Story = { ...BaseStory("share") };
export const Subscribe: Story = { ...BaseStory("subscribe") };
export const Upvote: Story = { ...BaseStory("upvote") };
export const Overflow: Story = { ...BaseStory("overflow") };
