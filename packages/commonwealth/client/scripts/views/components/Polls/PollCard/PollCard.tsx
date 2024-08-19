import React, { useState } from 'react';
import {
  CastVoteProps,
  CastVoteSection,
  DeletePollModal,
  PollOptionProps,
  PollOptions,
  ResultsSectionProps,
  ResultsSections,
  VoteDisplay,
} from 'views/components/Polls';
import { buildVoteDirectionString } from 'views/components/Polls/utils';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';

import './PollCard.scss';

export type PollCardProps = PollOptionProps &
  CastVoteProps &
  ResultsSectionProps & {
    hasVoted?: boolean;
    incrementalVoteCast?: number;
    proposalTitle?: string;
    showDeleteButton?: boolean;
    onDeleteClick?: () => void;
  };

export const PollCard = ({
  disableVoteButton = false,
  isPreview = false,
  showDeleteButton = false,
  onDeleteClick,
  multiSelect,
  onResultsClick,
  onVoteCast,
  pollEnded,
  proposalTitle,
  timeRemaining,
  tokenSymbol,
  tooltipErrorMessage,
  votedFor,
  voteInformation,
  hasVoted,
  totalVoteCount,
}: PollCardProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Array<string>>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const resultString = 'Results';

  const castVote = async () => {
    if (
      multiSelect ||
      selectedOptions[0] === votedFor ||
      selectedOptions.length === 0
    ) {
      // TODO: Build this out when multiple vote options are introduced.
      return;
    }

    await onVoteCast(selectedOptions[0], selectedOptions.length === 0);
  };

  return (
    <CWCard className="PollCard">
      <div className="poll-title-section">
        <CWText type="b2" className="poll-title-text">
          {proposalTitle}
        </CWText>
        <CWModal
          size="small"
          content={
            <DeletePollModal
              onDelete={async () => {
                onDeleteClick?.();
                setDeleteModalOpen(false);
              }}
              onClose={() => setDeleteModalOpen(false)}
            />
          }
          onClose={() => setDeleteModalOpen(false)}
          open={deleteModalOpen}
        />
        {showDeleteButton && (
          <CWIcon
            iconName="close"
            iconSize="small"
            className="poll-delete-button"
            onClick={() => {
              setDeleteModalOpen(true);
            }}
          />
        )}
      </div>

      <div className="poll-voting-section">
        {!hasVoted && !pollEnded && !isPreview && (
          <>
            <PollOptions
              multiSelect={multiSelect}
              voteInformation={voteInformation}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              disableVoteOptions={disableVoteButton}
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
        {((hasVoted && !isPreview) || pollEnded) && (
          <VoteDisplay
            timeRemaining={timeRemaining}
            voteDirectionString={
              votedFor
                ? buildVoteDirectionString(votedFor)
                : buildVoteDirectionString(selectedOptions[0])
            }
            pollEnded={pollEnded}
            voteInformation={voteInformation}
            isSnapshot={false}
          />
        )}
      </div>
      <ResultsSections
        resultString={resultString}
        onResultsClick={onResultsClick}
        tokenSymbol={tokenSymbol}
        voteInformation={voteInformation}
        pollEnded={pollEnded}
        totalVoteCount={totalVoteCount}
        votedFor={votedFor}
        isPreview={isPreview}
      />
    </CWCard>
  );
};
