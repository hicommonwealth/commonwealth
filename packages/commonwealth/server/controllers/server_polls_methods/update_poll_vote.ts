import moment from 'moment';

import { AppError, ServerError } from '@hicommonwealth/core';
import {
  AddressInstance,
  UserInstance,
  VoteAttributes,
} from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { TrackOptions } from '../server_analytics_controller';
import { ServerPollsController } from '../server_polls_controller';

export const Errors = {
  NoPoll: 'No corresponding poll found',
  NoThread: 'No corresponding thread found',
  InvalidUser: 'Invalid user',
  InvalidOption: 'Invalid response option',
  PollingClosed: 'Polling already finished',
  BalanceCheckFailed: 'Could not verify user token balance',
  InsufficientTokenBalance: 'Insufficient token balance',
  ParseError: 'Failed to parse poll options',
};

export type UpdatePollVoteOptions = {
  user: UserInstance;
  address: AddressInstance;
  pollId: number;
  option: string;
};

export type UpdatePollVoteResult = [VoteAttributes, TrackOptions];

export async function __updatePollVote(
  this: ServerPollsController,
  { user, address, pollId, option }: UpdatePollVoteOptions,
): Promise<UpdatePollVoteResult> {
  const poll = await this.models.Poll.findOne({
    where: { id: pollId },
  });
  if (!poll) {
    throw new AppError(Errors.NoPoll);
  }
  if (!poll.ends_at && moment(poll.ends_at).utc().isBefore(moment().utc())) {
    throw new AppError(Errors.PollingClosed);
  }

  // Ensure user has passed a valid poll response
  const pollOptions = (() => {
    try {
      return JSON.parse(poll.options);
    } catch (err) {
      throw new AppError(Errors.ParseError);
    }
  })();

  const selectedOption = pollOptions.find((o: string) => o === option);
  if (!selectedOption) {
    throw new AppError(Errors.InvalidOption);
  }

  const thread = await this.models.Thread.findOne({
    where: { id: poll.thread_id },
  });
  if (!thread) {
    throw new AppError(Errors.NoThread);
  }

  try {
    // check token balance threshold if needed
    const { isValid } = await validateTopicGroupsMembership(
      this.models,
      thread.topic_id,
      poll.community_id,
      address,
    );
    if (!isValid) {
      throw new AppError(Errors.InsufficientTokenBalance);
    }
  } catch (e) {
    throw new ServerError(Errors.BalanceCheckFailed, e);
  }

  const vote = await this.models.sequelize.transaction(async (transaction) => {
    const voteData: Partial<VoteAttributes> = {
      poll_id: poll.id,
      address: address.address,
      author_community_id: address.community_id,
      community_id: poll.community_id,
    };
    // delete existing votes
    await this.models.Vote.destroy({
      where: voteData,
      transaction,
    });
    // create new vote
    return this.models.Vote.create(
      {
        ...voteData,
        option: selectedOption,
      },
      { transaction },
    );
  });

  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.SUBMIT_VOTE,
    community: poll.community_id,
    userId: user.id,
  };

  return [vote.toJSON(), analyticsOptions];
}
