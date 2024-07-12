import { notifyError, notifySuccess } from 'controllers/app/notifications';
import moment from 'moment';
import 'pages/view_thread/poll_cards.scss';
import React, { useState } from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import type Poll from '../../../models/Poll';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PollCard } from '../../components/poll_card';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { getPollTimestamp, handlePollVote } from './helpers';

type ThreadPollCardProps = {
  poll: Poll;
  onVote: () => void;
  showDeleteButton?: boolean;
  onDelete?: () => void;
  isTopicMembershipRestricted?: boolean;
};

export const ThreadPollCard = ({
  poll,
  onVote,
  showDeleteButton,
  onDelete,
  isTopicMembershipRestricted = false,
}: ThreadPollCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = useUserStore();

  const getTooltipErrorMessage = () => {
    if (!user.activeAccount)
      return 'Error: You must join this community to vote.';
    if (isTopicMembershipRestricted) return 'Error: Topic is gated.';
    return '';
  };

  return (
    <>
      <PollCard
        multiSelect={false}
        pollEnded={poll.endsAt && poll.endsAt?.isBefore(moment().utc())}
        hasVoted={
          !!(
            user.activeAccount?.community?.id &&
            user.activeAccount?.address &&
            poll.getUserVote(
              user.activeAccount?.community?.id,
              user.activeAccount?.address,
            )
          )
        }
        disableVoteButton={!user.activeAccount || isTopicMembershipRestricted}
        // @ts-expect-error <StrictNullChecks/>
        votedFor={
          user.activeAccount?.community?.id &&
          user.activeAccount?.address &&
          poll.getUserVote(
            user.activeAccount?.community?.id,
            user.activeAccount?.address,
          )?.option
        }
        proposalTitle={poll.prompt}
        timeRemaining={getPollTimestamp(
          poll,
          poll.endsAt && poll.endsAt?.isBefore(moment().utc()),
        )}
        totalVoteCount={poll.votes?.length}
        voteInformation={poll.options.map((option) => {
          return {
            label: option,
            value: option,
            voteCount: poll.votes.filter((v) => v.option === option).length,
          };
        })}
        incrementalVoteCast={1}
        isPreview={false}
        tooltipErrorMessage={getTooltipErrorMessage()}
        onVoteCast={(option, isSelected) => {
          // @ts-expect-error <StrictNullChecks/>
          handlePollVote(poll, option, isSelected, onVote);
        }}
        onResultsClick={(e) => {
          e.preventDefault();
          if (poll.votes.length > 0) {
            setIsModalOpen(true);
          }
        }}
        showDeleteButton={showDeleteButton}
        onDeleteClick={async () => {
          try {
            await app.polls.deletePoll({
              threadId: poll.threadId,
              pollId: poll.id,
              address: user.activeAccount?.address || '',
              authorCommunity: user.activeAccount?.community.id || '',
            });
            if (onDelete) onDelete();
            notifySuccess('Poll deleted');
          } catch (e) {
            console.error(e);
            notifyError('Failed to delete poll');
          }
        }}
      />
      <CWModal
        size="small"
        content={
          <OffchainVotingModal
            votes={poll.votes}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
