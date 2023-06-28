import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWUpvote } from "../../../client/scripts/views/components/component_kit/new_designs/cw_upvote";

const upvote = {
  title: "Components/Thread Actions/Upvote",
  component: CWUpvote,
} satisfies Meta<typeof CWUpvote>;

export default upvote;
type Story = StoryObj<typeof upvote>;

export const Upvote: Story = {
  args: {
    voteCount: 8887,
    active: false,
    disabled: false,
  },
  render: ({...args}) => <CWUpvote {...args} />,
}
