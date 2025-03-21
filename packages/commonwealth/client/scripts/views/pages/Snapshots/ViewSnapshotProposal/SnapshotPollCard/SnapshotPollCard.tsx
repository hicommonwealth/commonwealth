import React, { useEffect, useState } from 'react';

import { MixpanelSnapshotEvents } from 'analytics/types';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { PollCardProps, VoteInformation } from 'views/components/Polls';

import VotingActionCard from 'client/scripts/views/components/proposals/VotingActionCard';
import { VoteOption } from 'client/scripts/views/components/proposals/VotingResultView';
import '../../../../components/Polls/PollCard/PollCard.scss';

export type SnapshotPollCardProps = Omit<
  PollCardProps & {
    onSnapshotVoteCast: (option: string) => void;
    snapShotVotingResult: VoteOption[];
    toggleShowVotesDrawer: (newState: boolean) => void;
  },
  'onResultsClick'
>;

export const SnapshotPollCard = ({
  hasVoted,
  onSnapshotVoteCast,
  pollEnded,
  timeRemaining,
  voteInformation,
  snapShotVotingResult,
  toggleShowVotesDrawer,
  votedFor,
}: SnapshotPollCardProps) => {
  const [internalHasVoted, setInternalHasVoted] =
    // @ts-expect-error <StrictNullChecks/>
    useState<boolean>(hasVoted);

  const [internalVoteInformation, setInternalVoteInformation] =
    useState<Array<VoteInformation>>(voteInformation);

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  const castVote = (e) => {
    const selectedOption = e[0];
    onSnapshotVoteCast(selectedOption);
    trackAnalytics({
      event: MixpanelSnapshotEvents.SNAPSHOT_VOTE_OCCURRED,
      isPWA: isAddedToHomeScreen,
    });
  };

  useEffect(() => {
    if (hasVoted) {
      setInternalHasVoted(true);
    }
  }, [hasVoted]);

  useEffect(() => {
    setInternalVoteInformation(voteInformation);
  }, [voteInformation]);

  console.log('userVote', { votedFor });
  return (
    <div className="poll-voting-section">
      <VotingActionCard
        options={internalVoteInformation}
        timeRemaining={timeRemaining}
        canVote={!internalHasVoted && !pollEnded}
        hasVoted={hasVoted}
        onVote={castVote}
        type="snapshot"
        votingOption={snapShotVotingResult}
        toggleShowVotesDrawer={toggleShowVotesDrawer}
        defaultVotingOption={votedFor}
      />
    </div>
  );
};
