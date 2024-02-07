import React, { useEffect } from 'react';

import 'components/poll_card.scss';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';

import type {
  PollCardProps,
  VoteInformation,
} from '../../components/poll_card';
import {
  buildVoteDirectionString,
  CastVoteSection,
  PollOptions,
  ResultsSection,
  VoteDisplay,
} from '../../components/poll_card';

export type SnapshotPollCardProps = Omit<
  PollCardProps & {
    onSnapshotVoteCast: (option: string) => void;
  },
  'multiSelect' | 'onResultsClick'
>;

export const SnapshotPollCard = (props: SnapshotPollCardProps) => {
  const {
    disableVoteButton = false,
    hasVoted,
    incrementalVoteCast,
    isPreview,
    onVoteCast,
    onSnapshotVoteCast,
    pollEnded,
    proposalTitle,
    timeRemaining,
    tokenSymbol,
    tooltipErrorMessage,
    totalVoteCount,
    votedFor,
    voteInformation,
  } = props;

  const [internalHasVoted, setInternalHasVoted] =
    React.useState<boolean>(hasVoted);
  const [selectedOptions, setSelectedOptions] = React.useState<Array<string>>(
    [] // is never updated?
  );
  const [internalTotalVoteCount, setInternalTotalVoteCount] =
    React.useState<number>(totalVoteCount);
  const [voteDirectionString, setVoteDirectionString] = React.useState<string>(
    votedFor ? buildVoteDirectionString(votedFor) : ''
  );
  const [internalVoteInformation, setInternalVoteInformation] =
    React.useState<Array<VoteInformation>>(voteInformation);

  const resultString = 'Results';

  const castVote = () => {
    setVoteDirectionString(buildVoteDirectionString(selectedOptions[0]));
    onSnapshotVoteCast(selectedOptions[0]);
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
              multiSelect={false}
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
      <ResultsSection
        resultString={resultString}
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
