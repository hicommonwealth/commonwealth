import moment from 'moment';
import { AppError } from '../../../../common-common/src/errors';
import { ServerThreadsController } from '../server_threads_controller';
import { PollAttributes } from 'server/models/poll';
import { UserInstance } from 'server/models/user';
import { AddressInstance } from 'server/models/address';
import { ChainInstance } from 'server/models/chain';
import { validateOwner } from 'server/util/validateOwner';

export const Errors = {
  NoThread: 'Cannot find thread',
  InvalidDuration: 'Invalid poll duration',
  NotAuthor: 'Only the thread author can start polling',
  MustBeAdmin: 'Must be admin to create poll',
};

export type CreateThreadPollOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  threadId: number;
  prompt: string;
  options: any;
  customDuration: any;
};
export type CreateThreadPollResult = PollAttributes;

export async function __createThreadPoll(
  this: ServerThreadsController,
  {
    user,
    address,
    chain,
    threadId,
    prompt,
    options,
    customDuration,
  }: CreateThreadPollOptions
): Promise<CreateThreadPollResult> {
  if (customDuration && customDuration !== 'Infinite') {
    customDuration = Number(customDuration);
    if (
      !Number.isInteger(customDuration) ||
      customDuration < 0 ||
      customDuration > 31
    ) {
      throw new AppError(Errors.InvalidDuration);
    }
  }
  const ends_at =
    customDuration === 'Infinite'
      ? null
      : customDuration
      ? moment().add(customDuration, 'days').toDate()
      : moment().add(5, 'days').toDate();

  const thread = await this.models.Thread.findOne({
    where: {
      id: threadId,
    },
  });
  if (!thread) {
    throw new AppError(Errors.NoThread);
  }

  const isThreadOwner = await validateOwner({
    models: this.models,
    user,
    chainId: chain.id,
    entity: thread,
  });
  if (!isThreadOwner) {
    throw new AppError(Errors.NotAuthor);
  }

  // check if admin_only flag is set
  if (thread.Chain?.admin_only_polling) {
    const isAdmin = await validateOwner({
      models: this.models,
      user,
      chainId: chain.id,
      allowAdmin: true,
    });
    if (!isAdmin) {
      new AppError(Errors.MustBeAdmin);
    }
  }

  const poll = await this.models.sequelize.transaction(async (transaction) => {
    thread.has_poll = true;
    await thread.save({ transaction });
    return this.models.Poll.create(
      {
        thread_id: thread.id,
        chain_id: thread.chain,
        prompt,
        options,
        ends_at,
      },
      { transaction }
    );
  });

  return poll.toJSON();
}
