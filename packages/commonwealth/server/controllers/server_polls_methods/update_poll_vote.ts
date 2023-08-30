import { UserInstance } from 'server/models/user';
import { ServerThreadsController } from '../server_threads_controller';
import { VoteAttributes } from 'server/models/vote';
import { AddressInstance } from 'server/models/address';
import { ChainInstance } from 'server/models/chain';
import { AppError } from '../../../../common-common/src/errors';
import moment from 'moment';
import validateTopicThreshold from 'server/util/validateTopicThreshold';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';

export const Errors = {
  NoPoll: 'No corresponding poll found',
  NoThread: 'No corresponding thread found',
  InvalidUser: 'Invalid user',
  InvalidOption: 'Invalid response option',
  PollingClosed: 'Polling already finished',
  BalanceCheckFailed: 'Could not verify user token balance',
  InsufficientTokenBalance: 'Insufficient token balance',
};

export type UpdatePollVoteOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  pollId: number;
  option: string;
};

export type UpdatePollVoteResult = VoteAttributes;

export async function __updatePollVote(
  this: ServerThreadsController,
  { user, address, chain, pollId, option }: UpdatePollVoteOptions
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
  let selected_option;
  try {
    const pollOptions = JSON.parse(poll.options);
    selected_option = pollOptions.find((o: string) => o === option);
    if (!option) throw new AppError(Errors.InvalidOption);
  } catch (e) {
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
      address.address
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
      author_chain: address.chain,
      chain_id: chain.id,
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
        option: selected_option,
      },
      { transaction }
    );
  });

  return vote.toJSON();
}
