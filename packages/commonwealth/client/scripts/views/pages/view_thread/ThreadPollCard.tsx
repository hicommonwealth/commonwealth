import { PollView, TopicWeightedVoting } from '@hicommonwealth/schemas';
import { ActionGroups, GatedActionEnum } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type Thread from 'models/Thread';
import moment from 'moment';
import React from 'react';
import { useDeletePollMutation, useVotePollMutation } from 'state/api/polls';
import useUserStore from 'state/ui/user';
import { SetLocalPolls } from 'utils/polls';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { z } from 'zod';
import Permissions from '../../../utils/Permissions';
import { PollCard } from '../../components/Polls';
import { getPollTimestamp, getPollEndDateString } from './helpers';
import './poll_cards.scss';

type ThreadPollCardProps = {
  thread?: Thread;
  poll: z.infer<typeof PollView> & { thread_id?: number };
  showDeleteButton?: boolean;
  isCreateThreadPage?: boolean;
  setLocalPoll?: SetLocalPolls;
  tokenDecimals?: number;
  topicWeight?: TopicWeightedVoting | null;
  voterProfiles?: Record<
    string,
    { address: string; name: string; avatarUrl?: string }
  >;
  isLoadingVotes?: boolean;
  actionGroups: ActionGroups;
  bypassGating: boolean;
};

export const ThreadPollCard = ({
  thread,
  poll,
  showDeleteButton,
  isCreateThreadPage = false,
  setLocalPoll,
  tokenDecimals,
  topicWeight,
  voterProfiles,
  isLoadingVotes,
  actionGroups,
  bypassGating,
}: ThreadPollCardProps) => {
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

  const totalVoteWeight = pollVotes.reduce((sum, vote) => {
    const weight =
      vote.calculated_voting_weight &&
      BigInt(vote.calculated_voting_weight) > 0n
        ? BigInt(vote.calculated_voting_weight)
        : 1n;
    return sum + weight;
  }, 0n);

  const voteInformation = poll.options.map((option) => ({
    label: option,
    value: option,
    voteCount: pollVotes
      .filter((v) => v.option === option)
      .reduce((sum, val) => {
        const weight =
          val.calculated_voting_weight &&
          BigInt(val.calculated_voting_weight) > 0n
            ? BigInt(val.calculated_voting_weight)
            : 1n;
        return sum + weight;
      }, 0n),
  }));

  return (
    <>
      <PollCard
        communityId={poll.community_id}
        individualVotesData={pollVotes}
        voterProfiles={voterProfiles}
        tokenDecimals={tokenDecimals}
        topicWeight={topicWeight}
        isLoadingVotes={isLoadingVotes}
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
        endTimestamp={getPollEndDateString(poll)}
        totalVoteCount={pollVotes.length}
        totalVoteWeight={totalVoteWeight}
        voteInformation={voteInformation}
        incrementalVoteCast={1}
        isPreview={false}
        tooltipErrorMessage={permissions.tooltip}
        onVoteCast={(option, isSelected) => {
          if (option !== undefined) {
            handlePollVote(poll, option, isSelected ?? false);
          }
        }}
        onResultsClick={(e) => {
          if (!(e && pollVotes.length === 0)) return;
          // No-op: No votes to show, so do nothing
        }}
        showDeleteButton={showDeleteButton}
        onDeleteClick={() => {
          if (isCreateThreadPage && setLocalPoll) {
            setLocalPoll([]);
          } else {
            handleDeletePoll().catch(console.error);
          }
        }}
      />
    </>
  );
};
