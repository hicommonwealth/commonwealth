import React, { FC, useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWUpvote } from "../../../client/scripts/views/components/component_kit/new_designs/cw_upvote";

const upvote = {
  title: "Components/Thread Actions/Upvote",
  component: CWUpvote,
} satisfies Meta<typeof CWUpvote>;

export default upvote;
type Story = StoryObj<typeof upvote>;

interface UpvoteProps {
  count: number;
  active?: boolean;
  disabled?: boolean;
};

const UpvoteButton: FC<UpvoteProps> = ({ count, active, disabled }) => {
  const [voteCount, setVoteCount] = useState<number>(count);

  useEffect(() => setVoteCount(count), [count]);

  return (
    <CWUpvote
      voteCount={voteCount}
      active={active}
      disabled={disabled}
    />
  );
};

export const Upvote: Story = {
  args: {
    voteCount: 8887,
    active: false,
    disabled: false,
  },
  render: ({...args}) => (
    <UpvoteButton
      count={args.voteCount}
      active={args.active}
      disabled={args.disabled}
    />
  ),
}
