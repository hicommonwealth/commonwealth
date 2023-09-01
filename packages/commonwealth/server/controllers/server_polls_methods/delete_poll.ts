import { ServerThreadsController } from '../server_threads_controller';
import { validateOwner } from '../../util/validateOwner';
import { UserInstance } from '../../models/user';
import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { AppError } from '../../../../common-common/src/errors';

export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  NotAuthor: 'Not the Author or Admin',
  NoThread: 'No thread provided',
  NoPoll: 'No poll found',
};

export type DeletePollOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  pollId: number;
};

export type DeletePollResult = void;

export async function __deletePoll(
  this: ServerThreadsController,
  { user, address, chain, pollId }: DeletePollOptions
): Promise<DeletePollResult> {
  const poll = await this.models.Poll.findByPk(pollId);
  if (!poll) {
    throw new AppError(Errors.NoPoll);
  }

  const thread = await this.models.Thread.findOne({
    where: {
      id: poll.thread_id,
    },
  });
  if (!thread) {
    throw new AppError(Errors.NoThread);
  }

  const isThreadOwnerOrAdmin = await validateOwner({
    models: this.models,
    user,
    chainId: chain.id,
    entity: thread,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isThreadOwnerOrAdmin) {
    throw new AppError(Errors.NotAuthor);
  }

  await this.models.sequelize.transaction(async (transaction) => {
    await this.models.Vote.destroy({
      where: { poll_id: poll.id },
      transaction,
    });

    await poll.destroy({ transaction });

    thread.has_poll = false;
    await thread.save({ transaction });
  });
}
