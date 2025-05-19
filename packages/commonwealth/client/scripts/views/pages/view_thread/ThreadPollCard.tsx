import { PollView } from '@hicommonwealth/schemas';
import { ActionGroups, GatedActionEnum } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type Thread from 'models/Thread';
import moment from 'moment';
import React, { useState } from 'react';
import { useDeletePollMutation, useVotePollMutation } from 'state/api/polls';
import useUserStore from 'state/ui/user';
import { SetLocalPolls } from 'utils/polls';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { z } from 'zod';
import Permissions from '../../../utils/Permissions';
import { PollCard } from '../../components/Polls';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { getPollTimestamp } from './helpers';
import './poll_cards.scss';

type ThreadPollCardProps = {
  thread?: Thread;
  poll: z.infer<typeof PollView> & { thread_id?: number };
  showDeleteButton?: boolean;
  isCreateThreadPage?: boolean;
  setLocalPoll?: SetLocalPolls;
  actionGroups: ActionGroups;
  bypassGating: boolean;
};

export const ThreadPollCard = ({
  thread,
  poll,
  showDeleteButton,
  isCreateThreadPage = false,
  setLocalPoll,
  actionGroups,
  bypassGating,
}: ThreadPollCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = useUserStore();

  const { mutateAsync: deletePoll } = useDeletePollMutation({
    threadId: poll.thread_id,
  });

  const { mutateAsync: votePoll } = useVotePollMutation({
    threadId: poll.thread_id,
  });

  const pollVotes = poll.votes || [];

  const userVote = pollVotes.find(
    (p) =>
      p.address === user.activeAccount?.address &&
      p.community_id === user.activeAccount?.community?.id,
  );

  const permissions = Permissions.getGeneralActionPermission({
    action: GatedActionEnum.UPDATE_POLL,
    thread: thread!,
    actionGroups,
    bypassGating,
  });

  const handleDeletePoll = async () => {
    try {
      await deletePoll({
        thread_id: poll.thread_id,
        poll_id: poll.id!,
      });
      notifySuccess('Poll deleted');
    } catch (e) {
      console.error(e);
      notifyError('Failed to delete poll');
    }
  };

  const handlePollVote = (
    votedPoll: z.infer<typeof PollView>,
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
          onClick: () => {
            const selectedOption = votedPoll.options.find((o) => o === option);

            if (!selectedOption) {
              notifyError('Invalid voting option');
              return;
            }

            votePoll({
              thread_id: votedPoll.thread_id,
              poll_id: votedPoll.id!,
              option: selectedOption,
            }).catch((err) => {
              console.error(err);
              notifyError(
                'Error submitting vote. Check if poll is still active.',
              );
            });
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

  // votes by weighted voting power
  const totalVoteWeight = pollVotes.reduce(
    (sum, vote) => sum + BigInt(vote.calculated_voting_weight || 1),
    0n,
  );
  const voteInformation = poll.options.map((option) => ({
    label: option,
    value: option,
    voteCount: pollVotes
      .filter((v) => v.option === option)
      .reduce(
        (sum, val) => sum + BigInt(val.calculated_voting_weight || 1),
        0n,
      ),
  }));

  return (
    <>
      <PollCard
        pollEnded={
          !!poll.ends_at && moment(poll.ends_at).isBefore(moment().utc())
        }
        hasVoted={!!userVote}
        disableVoteButton={!permissions.allowed || isCreateThreadPage}
        votedFor={userVote?.option || ''}
        proposalTitle={poll.prompt}
        timeRemaining={getPollTimestamp(
          poll,
          !!poll.ends_at && moment(poll.ends_at).isBefore(moment().utc()),
        )}
        totalVoteCount={pollVotes.length}
        totalVoteWeight={totalVoteWeight}
        voteInformation={voteInformation}
        incrementalVoteCast={1}
        isPreview={false}
        tooltipErrorMessage={permissions.tooltip}
        onVoteCast={(option, isSelected) => {
          // @ts-expect-error <StrictNullChecks/>
          handlePollVote(poll, option, isSelected);
        }}
        onResultsClick={(e) => {
          e.preventDefault();
          if (pollVotes.length > 0) {
            setIsModalOpen(true);
          }
        }}
        showDeleteButton={showDeleteButton}
        onDeleteClick={() => {
          if (isCreateThreadPage && setLocalPoll) {
            setLocalPoll([]);
          } else {
            //@typescript-eslint/no-misused-promises
            handleDeletePoll().catch(console.error);
          }
        }}
      />
      <CWModal
        size="small"
        content={
          <OffchainVotingModal
            votes={pollVotes}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
