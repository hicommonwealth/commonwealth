import {
  TopicWeightedVoting,
  Vote as VoteSchema,
} from '@hicommonwealth/schemas';
import { ActionGroups, GatedActionEnum } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type Thread from 'models/Thread';
import moment from 'moment';
import React from 'react';
import { useDeletePollMutation, useVotePollMutation } from 'state/api/polls';
import useUserStore from 'state/ui/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { z } from 'zod';
import type Poll from '../../../models/Poll';
import Permissions from '../../../utils/Permissions';
import { PollCard } from '../../components/Polls';
import { getPollTimestamp } from './helpers';
import './poll_cards.scss';

type ActualVoteAttributes = z.infer<typeof VoteSchema>;

type ThreadPollCardProps = {
  thread?: Thread;
  poll: Poll;
  showDeleteButton?: boolean;
  isCreateThreadPage?: boolean;
  setLocalPoll?: (params) => void;
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
    threadId: poll.threadId,
  });

  const { mutateAsync: votePoll } = useVotePollMutation({
    threadId: poll.threadId,
  });

  const permissions = Permissions.getGeneralActionPermission({
    action: GatedActionEnum.UPDATE_POLL,
    thread: thread!,
    actionGroups,
    bypassGating,
  });

  const handleDeletePoll = async () => {
    try {
      await deletePoll({
        thread_id: poll.threadId,
        poll_id: poll.id,
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

  const userVote = poll?.getUserVote?.(
    user.activeAccount?.community?.id || '',
    user.activeAccount?.address || '',
  );

  const totalVoteWeight = poll.votes.reduce((sum, vote) => {
    const weight =
      vote.calculatedVotingWeight && BigInt(vote.calculatedVotingWeight) > 0n
        ? BigInt(vote.calculatedVotingWeight)
        : 1n;
    return sum + weight;
  }, 0n);

  const voteInformation = poll.options.map((option) => ({
    label: option,
    value: option,
    voteCount: poll.votes
      .filter((v) => v.option === option)
      .reduce((sum, val) => {
        const weight =
          val.calculatedVotingWeight && BigInt(val.calculatedVotingWeight) > 0n
            ? BigInt(val.calculatedVotingWeight)
            : 1n;
        return sum + weight;
      }, 0n),
  }));

  const individualVotesData: ActualVoteAttributes[] = poll.votes.map(
    (vote) => ({
      id: vote.id,
      poll_id: vote.pollId,
      community_id: vote.communityId,
      author_community_id: vote.authorCommunityId,
      address: vote.address,
      option: vote.option,
      created_at: vote.createdAt.toDate(),
      calculated_voting_weight: vote.calculatedVotingWeight,
    }),
  );

  return (
    <>
      <PollCard
        communityId={poll.communityId}
        individualVotesData={individualVotesData}
        voterProfiles={voterProfiles}
        tokenDecimals={tokenDecimals}
        topicWeight={topicWeight}
        isLoadingVotes={isLoadingVotes}
        pollEnded={poll.endsAt && poll.endsAt?.isBefore(moment().utc())}
        hasVoted={!!userVote}
        disableVoteButton={!permissions.allowed || isCreateThreadPage}
        votedFor={userVote?.option || ''}
        proposalTitle={poll.prompt}
        timeRemaining={getPollTimestamp(
          poll,
          poll?.endsAt && poll?.endsAt?.isBefore(moment().utc()),
        )}
        totalVoteCount={poll.votes.length}
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
          if (!(e && poll.votes.length === 0)) return;
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
