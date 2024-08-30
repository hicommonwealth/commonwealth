import React, { useEffect, useState } from 'react';

import { MixpanelSnapshotEvents } from 'analytics/types';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import {
  CastVoteSection,
  PollCardProps,
  PollOptions,
  ResultsSections,
  VoteDisplay,
  VoteInformation,
} from 'views/components/Polls';
import { buildVoteDirectionString } from 'views/components/Polls/utils';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';

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

  const castVote = () => {
    setVoteDirectionString(buildVoteDirectionString(selectedOptions[0]));
    onSnapshotVoteCast(selectedOptions[0]);
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
    <CWCard className="PollCard">
      <div className="poll-title-section">
        <CWText type="b2" className="poll-title-text">
          {proposalTitle}
        </CWText>
      </div>

      <div className="poll-voting-section">
        {!internalHasVoted && !pollEnded && !isPreview && (
          <>
            <PollOptions
              voteInformation={internalVoteInformation}
              selectedOptions={selectedOptions}
              disableVoteOptions={disableVoteButton}
              setSelectedOptions={setSelectedOptions}
            />
            <CastVoteSection
              disableVoteButton={
                disableVoteButton || selectedOptions.length === 0
              }
              timeRemaining={timeRemaining}
              tooltipErrorMessage={tooltipErrorMessage}
              onVoteCast={castVote}
            />
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
      <ResultsSections
        resultString={resultString}
        // @ts-expect-error <StrictNullChecks/>
        onResultsClick={null}
        tokenSymbol={tokenSymbol}
        voteInformation={internalVoteInformation}
        pollEnded={pollEnded}
        totalVoteCount={internalTotalVoteCount}
        votedFor={votedFor}
        isPreview={isPreview}
      />
    </CWCard>
  );
};
