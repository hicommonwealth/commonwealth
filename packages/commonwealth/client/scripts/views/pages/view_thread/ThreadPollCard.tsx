import React, { useState } from 'react';
import moment from 'moment';
import type Poll from '../../../models/Poll';
import 'pages/view_thread/poll_cards.scss';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PollCard } from '../../components/poll_card';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { getPollTimestamp, handlePollVote } from './helpers';

type ThreadPollCardProps = {
  poll: Poll;
  onVote: () => void;
  showDeleteButton?: boolean;
  onDelete?: () => void;
};

export const ThreadPollCard = ({
  poll,
  onVote,
  showDeleteButton,
  onDelete,
}: ThreadPollCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PollCard
        multiSelect={false}
        pollEnded={poll.endsAt && poll.endsAt?.isBefore(moment().utc())}
        hasVoted={
          app.user.activeAccount &&
          !!poll.getUserVote(
            app.user.activeAccount?.community?.id,
            app.user.activeAccount?.address
          )
        }
        disableVoteButton={!app.user.activeAccount}
        votedFor={
          poll.getUserVote(
            app.user.activeAccount?.community?.id,
            app.user.activeAccount?.address
          )?.option
        }
        proposalTitle={poll.prompt}
        timeRemaining={getPollTimestamp(
          poll,
          poll.endsAt && poll.endsAt?.isBefore(moment().utc())
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
        tooltipErrorMessage={
          app.user.activeAccount
            ? null
            : 'You must join this community to vote.'
        }
        onVoteCast={(option, isSelected) => {
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
              address: app.user.activeAccount.address,
              authorChain: app.user.activeAccount.community.id,
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
