import {
  TopicWeightedVoting,
  Vote as VoteSchema,
} from '@hicommonwealth/schemas';
import moment from 'moment';
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
import { z } from 'zod';
import { downloadCSV } from '../../../pages/AdminPanel/utils';
import {
  ViewPollVotesDrawer,
  VoterWithProfile,
} from '../ViewPollVotesDrawer/ViewPollVotesDrawer';

import './PollCard.scss';

type ActualVoteAttributes = z.infer<typeof VoteSchema>;

interface VoterProfileData {
  name: string;
  avatarUrl?: string;
  address: string;
}

export type PollCardProps = PollOptionProps &
  CastVoteProps &
  ResultsSectionProps & {
    hasVoted?: boolean;
    incrementalVoteCast?: number;
    proposalTitle?: string;
    showDeleteButton?: boolean;
    onDeleteClick?: () => void;
    communityId: string;
    individualVotesData?: ActualVoteAttributes[];
    voterProfiles?: Record<string, VoterProfileData>;
    tokenDecimals?: number;
    topicWeight?: TopicWeightedVoting | null;
    isLoadingVotes?: boolean;
  };

export const PollCard = ({
  disableVoteButton = false,
  isPreview = false,
  showDeleteButton = false,
  onDeleteClick,
  onResultsClick,
  onVoteCast,
  pollEnded,
  proposalTitle = 'Poll',
  timeRemaining,
  tokenSymbol,
  tooltipErrorMessage,
  votedFor,
  voteInformation,
  hasVoted,
  totalVoteCount,
  totalVoteWeight,
  communityId,
  individualVotesData = [],
  voterProfiles = {},
  tokenDecimals,
  topicWeight,
  isLoadingVotes = false,
}: PollCardProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Array<string>>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pollVotesDrawerOpen, setPollVotesDrawerOpen] = useState(false);

  const resultString = 'Results';

  const castVote = () => {
    onVoteCast(selectedOptions[0], selectedOptions.length === 0);
  };

  const handleResultsClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onResultsClick) {
      onResultsClick(e);
    }
    if (totalVoteCount > 0 || isLoadingVotes) {
      setPollVotesDrawerOpen(true);
    }
  };

  const votesWithProfiles: VoterWithProfile[] = individualVotesData.map(
    (vote) => ({
      ...vote,
      profile: voterProfiles[vote.address.toLowerCase()],
    }),
  );

  const pollOptionsSummary = voteInformation.map((opt) => {
    const weightForOption = individualVotesData
      .filter((v) => String(v.option) === opt.value)
      .reduce(
        (sum, v) => sum + BigInt(v.calculated_voting_weight || '0'),
        BigInt(0),
      );

    return {
      id: opt.value,
      text: opt.label,
      voteCount: Number(opt.voteCount),
      totalWeightForOption: weightForOption.toString(),
    };
  });

  const handleDownloadCsv = () => {
    if (isLoadingVotes || votesWithProfiles.length === 0) return;

    const csvData = votesWithProfiles.map((vote) => {
      const optionDetails = pollOptionsSummary.find(
        (opt) => opt.id === String(vote.option),
      );
      const timestamp = vote.updated_at || vote.created_at;

      return {
        'Voter Name': vote.profile?.name || 'N/A',
        'Voter Address': vote.address,
        'Chosen Option': optionDetails?.text || String(vote.option),
        'Vote Weight': vote.calculated_voting_weight || '0',
        Timestamp: timestamp ? moment(timestamp).toISOString() : 'N/A',
      };
    });

    const filename = `${proposalTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_votes.csv`;
    downloadCSV(csvData, filename);
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
              onDelete={() => {
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
        onResultsClick={handleResultsClick}
        tokenSymbol={tokenSymbol}
        voteInformation={voteInformation}
        pollEnded={pollEnded}
        totalVoteCount={totalVoteCount}
        totalVoteWeight={totalVoteWeight}
        votedFor={votedFor}
        isPreview={isPreview}
      />

      {pollVotesDrawerOpen && (
        <ViewPollVotesDrawer
          header={`Votes for "${proposalTitle}"`}
          votes={votesWithProfiles}
          pollOptionsSummary={pollOptionsSummary}
          totalVoteWeightInPoll={totalVoteWeight.toString()}
          isOpen={pollVotesDrawerOpen}
          setIsOpen={setPollVotesDrawerOpen}
          tokenDecimals={tokenDecimals}
          topicWeight={topicWeight}
          communityId={communityId}
          onDownloadCsv={handleDownloadCsv}
          isLoading={isLoadingVotes}
        />
      )}
    </CWCard>
  );
};
