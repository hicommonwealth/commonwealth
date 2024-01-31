import { AppError } from '@hicommonwealth/adapters';
import { AddressInstance, UserInstance } from '@hicommonwealth/model';
import { validateOwner } from '../../util/validateOwner';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAuthor: 'Not the Author or Admin',
  NoThread: 'No thread provided',
  NoPoll: 'No poll found',
};

export type DeletePollOptions = {
  user: UserInstance;
  address: AddressInstance;
  pollId: number;
};

export type DeletePollResult = void;

export async function __deletePoll(
  this: ServerThreadsController,
  { user, pollId }: DeletePollOptions,
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
    communityId: thread.community_id,
    entity: thread,
    allowAdmin: true,
    allowSuperAdmin: true,
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
