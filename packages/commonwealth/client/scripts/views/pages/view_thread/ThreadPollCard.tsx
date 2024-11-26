import { notifyError, notifySuccess } from 'controllers/app/notifications';
import moment from 'moment';
import 'pages/view_thread/poll_cards.scss';
import React, { useState } from 'react';
import { useDeletePollMutation, useVotePollMutation } from 'state/api/polls';
import useUserStore from 'state/ui/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import type Poll from '../../../models/Poll';
import { PollCard } from '../../components/Polls';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { getPollTimestamp } from './helpers';

type ThreadPollCardProps = {
  poll: Poll;
  showDeleteButton?: boolean;
  isTopicMembershipRestricted?: boolean;
};

export const ThreadPollCard = ({
  poll,
  showDeleteButton,
  isTopicMembershipRestricted = false,
}: ThreadPollCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = useUserStore();

  const { mutateAsync: deletePoll } = useDeletePollMutation({
    threadId: poll.threadId,
  });

  const { mutateAsync: votePoll } = useVotePollMutation({
    threadId: poll.threadId,
  });

  const getTooltipErrorMessage = () => {
    if (!user.activeAccount)
      return 'Error: You must join this community to vote.';
    if (isTopicMembershipRestricted) return 'Error: Topic is gated.';
    return '';
  };

  const handleDeletePoll = async () => {
    try {
      await deletePoll({
        pollId: poll.id,
        address: user.activeAccount?.address || '',
        authorCommunity: user.activeAccount?.community?.id || '',
      });
      notifySuccess('Poll deleted');
    } catch (e) {
      console.error(e);
      notifyError('Failed to delete poll');
    }
  };

  const handlePollVote = (
    votedPoll: Poll,
    option: string,
    isSelected: boolean,
  ) => {
    if (!user.isLoggedIn || !user.activeAccount || isSelected) {
      return;
    }

    openConfirmation({
      title: 'Info',
      description: `Submit a vote for '${option}'?`,
      buttons: [
        {
          label: 'Submit',
          buttonType: 'primary',
          buttonHeight: 'sm',
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick: async () => {
            const selectedOption = votedPoll.options.find((o) => o === option);

            if (!selectedOption) {
              notifyError('Invalid voting option');
              return;
            }

            try {
              await votePoll({
                thread_id: votedPoll.threadId,
                poll_id: votedPoll.id,
                option: selectedOption,
              });
            } catch (err) {
              console.error(err);
              notifyError(
                'Error submitting vote. Check if poll is still active.',
              );
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const userVote = poll.getUserVote(
    user.activeAccount?.community?.id || '',
    user.activeAccount?.address || '',
  );

  return (
    <>
      <PollCard
        pollEnded={poll.endsAt && poll.endsAt?.isBefore(moment().utc())}
        hasVoted={!!userVote}
        disableVoteButton={!user.activeAccount || isTopicMembershipRestricted}
        votedFor={userVote?.option || ''}
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
          handlePollVote(poll, option, isSelected);
        }}
        onResultsClick={(e) => {
          e.preventDefault();
          if (poll.votes.length > 0) {
            setIsModalOpen(true);
          }
        }}
        showDeleteButton={showDeleteButton}
        onDeleteClick={() => {
          //@typescript-eslint/no-misused-promises
          handleDeletePoll().catch(console.error);
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
