import React, { useEffect, useState } from 'react';

import { MixpanelSnapshotEvents } from 'analytics/types';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { PollCardProps, VoteInformation } from 'views/components/Polls';
import { buildVoteDirectionString } from 'views/components/Polls/utils';

import { VoteOption } from 'client/scripts/views/components/proposals/VotingResultView';
import VotingUI from 'client/scripts/views/components/proposals/VotingUi';
import '../../../../components/Polls/PollCard/PollCard.scss';

export type SnapshotPollCardProps = Omit<
  PollCardProps & {
    onSnapshotVoteCast: (option: string) => void;
    snapShotVotingResult: VoteOption[];
  },
  'onResultsClick'
>;

export const SnapshotPollCard = ({
  hasVoted,
  onSnapshotVoteCast,
  pollEnded,
  timeRemaining,
  totalVoteCount,
  votedFor,
  voteInformation,
  snapShotVotingResult,
}: SnapshotPollCardProps) => {
  const [internalHasVoted, setInternalHasVoted] =
    // @ts-expect-error <StrictNullChecks/>
    useState<boolean>(hasVoted);
  const [selectedOptions, setSelectedOptions] = useState<Array<string>>(
    [], // is never updated?
  );
  const [internalTotalVoteCount, setInternalTotalVoteCount] =
    useState<number>(totalVoteCount);
  const [voteDirectionString, setVoteDirectionString] = useState<string>(
    votedFor ? buildVoteDirectionString(votedFor) : '',
  );
  const [internalVoteInformation, setInternalVoteInformation] =
    useState<Array<VoteInformation>>(voteInformation);

  const resultString = 'Results';

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  const castVote = (e) => {
    const selectedOption = e[0] || selectedOptions[0];
    setVoteDirectionString(buildVoteDirectionString(selectedOption));
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
    if (votedFor) {
      buildVoteDirectionString(votedFor);
    }
  }, [votedFor]);

  useEffect(() => {
    setInternalTotalVoteCount(totalVoteCount);
  }, [totalVoteCount]);

  useEffect(() => {
    setInternalVoteInformation(voteInformation);
  }, [voteInformation]);

  return (
    <div className="poll-voting-section">
      <VotingUI
        options={internalVoteInformation}
        timeRemaining={timeRemaining}
        canVote={!internalHasVoted && !pollEnded}
        hasVoted={hasVoted}
        onVote={castVote}
        type="snapshot"
        votingOption={snapShotVotingResult}
      />
    </div>
  );
};
