import moment from 'moment';

import { UserInstance } from 'server/models/user';
import { AppError, ServerError } from '../../../../common-common/src/errors';
import { AddressInstance } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { VoteAttributes } from '../../models/vote';
import validateTopicThreshold from '../../util/validateTopicThreshold';
import { ServerThreadsController } from '../server_threads_controller';

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
  chain: CommunityInstance;
  pollId: number;
  option: string;
};

export type UpdatePollVoteResult = VoteAttributes;

export async function __updatePollVote(
  this: ServerThreadsController,
  { address, chain, pollId, option }: UpdatePollVoteOptions,
): Promise<UpdatePollVoteResult> {
  const poll = await this.models.Poll.findOne({
    where: { id: pollId, chain_id: chain.id },
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
    const canVote = await validateTopicThreshold(
      this.tokenBalanceCache,
      this.models,
      thread.topic_id,
      address.address,
    );
    if (!canVote) {
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
      community_id: chain.id,
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

  return vote.toJSON();
}
