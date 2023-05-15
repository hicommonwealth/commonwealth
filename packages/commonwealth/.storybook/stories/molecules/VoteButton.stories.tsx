import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWThreadVoteButton } from '../../../client/scripts/views/components/component_kit/cw_thread_vote_button';

const voteButton = {
  title: 'Molecules/Vote Button',
  component: CWThreadVoteButton,
} satisfies Meta<typeof CWThreadVoteButton>;

export default voteButton;
// type Story = StoryObj<typeof voteButton>;

const VoteButton: FC = () => {
  const [voteCount, setVoteCount] = useState<number>(0);

  return (
    <CWThreadVoteButton
      updateVoteCount={(newCount: number) => {
        setVoteCount(newCount);
      }}
      voteCount={voteCount}
    />
  );
};

// export const VoteButtonStory: Story = {
export const VoteButtonStory = {
  name: 'Vote Button',
  render: () => <VoteButton />,
};
