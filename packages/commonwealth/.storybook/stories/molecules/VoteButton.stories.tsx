import React, { FC, useEffect, useState } from 'react';
import type { Meta } from '@storybook/react';

import { CWThreadVoteButton } from '../../../client/scripts/views/components/component_kit/cw_thread_vote_button';

const voteButton = {
  title: 'Molecules/Vote Button',
  component: CWThreadVoteButton,
} satisfies Meta<typeof CWThreadVoteButton>;

export default voteButton;

interface VoteButtonProps {
  count: number;
};

const VoteButton: FC<VoteButtonProps> = ({ count }) => {
  const [voteCount, setVoteCount] = useState<number>(count);

  useEffect(() => setVoteCount(count), [count]);

  return (
    <CWThreadVoteButton
      updateVoteCount={(newCount: number) => {
        setVoteCount(newCount);
      }}
      voteCount={voteCount}
    />
  )
};

export const VoteButtonStory = {
  name: "Vote Button",
  args: {
    voteCount: 0,
  },
  argTypes: {
    voteCount: {
      control: { type: "number" },
    },
  },
  parameters: {
    controls: {
      exclude: [ "updateVoteCount" ],
    },
  },
  render: ({...args}) => <VoteButton count={args.voteCount} />
};
