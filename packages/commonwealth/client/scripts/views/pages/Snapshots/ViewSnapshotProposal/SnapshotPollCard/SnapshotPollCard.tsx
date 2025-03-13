import React, { useEffect, useState } from 'react';

import { MixpanelSnapshotEvents } from 'analytics/types';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import {
  PollCardProps,
  VoteDisplay,
  VoteInformation,
} from 'views/components/Polls';
import { buildVoteDirectionString } from 'views/components/Polls/utils';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';

import VotingUI from 'client/scripts/views/components/proposals/VotingUi';
import '../../../../components/Polls/PollCard/PollCard.scss';

export type SnapshotPollCardProps = Omit<
  PollCardProps & {
    onSnapshotVoteCast: (option: string) => void;
  },
  'onResultsClick'
>;

export const SnapshotPollCard = ({
  disableVoteButton = false,
  hasVoted,
  isPreview,
  onSnapshotVoteCast,
  pollEnded,
  proposalTitle,
  timeRemaining,
  tokenSymbol,
  tooltipErrorMessage,
  totalVoteCount,
  votedFor,
  voteInformation,
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

  console.log('snapssss', { internalVoteInformation });
  return (
    <CWCard className="PollCard">
      <div className="poll-title-section">
        <CWText type="b2" className="poll-title-text">
          {proposalTitle}
        </CWText>
      </div>

      <div className="poll-voting-section">
        {!internalHasVoted && !pollEnded && !isPreview && (
          <>
            <VotingUI
              options={internalVoteInformation}
              proposalTitle={proposalTitle}
              timeRemaining={timeRemaining}
              canVote={false}
              hasVoted={false}
              onVote={castVote}
              type="snapshot"
            />
            {/* <PollOptions
              voteInformation={internalVoteInformation}
              selectedOptions={selectedOptions}
              disableVoteOptions={false}
              setSelectedOptions={setSelectedOptions}
            />
            <CastVoteSection
              disableVoteButton={false}
              timeRemaining={timeRemaining}
              tooltipErrorMessage={tooltipErrorMessage}
              onVoteCast={castVote}
            /> */}
          </>
        )}
        {((internalHasVoted && !isPreview) || pollEnded) && (
          <VoteDisplay
            timeRemaining={timeRemaining}
            voteDirectionString={voteDirectionString}
            pollEnded={pollEnded}
            voteInformation={internalVoteInformation}
            isSnapshot
          />
        )}
      </div>
      <br />
      {/* <ResultsSections
        resultString={resultString}
        // @ts-expect-error <StrictNullChecks/>
        onResultsClick={null}
        tokenSymbol={tokenSymbol}
        voteInformation={internalVoteInformation}
        pollEnded={pollEnded}
        totalVoteCount={internalTotalVoteCount}
        votedFor={votedFor}
        isPreview={isPreview}
      /> */}
    </CWCard>
  );
};
