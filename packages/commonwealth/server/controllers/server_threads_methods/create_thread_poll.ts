import moment from 'moment';
import { AppError } from '../../../../common-common/src/errors';
import { AddressInstance } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { PollAttributes } from '../../models/poll';
import { UserInstance } from '../../models/user';
import { validateOwner } from '../../util/validateOwner';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  NoThread: 'Cannot find thread',
  InvalidDuration: 'Invalid poll duration',
  NotAuthor: 'Only the thread author can start polling',
  MustBeAdmin: 'Must be admin to create poll',
};

export type CreateThreadPollOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: CommunityInstance;
  threadId: number;
  prompt: string;
  options: string[];
  customDuration?: number;
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
  }: CreateThreadPollOptions,
): Promise<CreateThreadPollResult> {
  if (customDuration) {
    if (
      customDuration !== Infinity &&
      (customDuration < 0 || customDuration > 31)
    ) {
      throw new AppError(Errors.InvalidDuration);
    }
  }
  const ends_at =
    customDuration === Infinity
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
        options: JSON.stringify(options),
        ends_at,
      },
      { transaction },
    );
  });

  return poll.toJSON();
}
