import moment from 'moment';
import { AppError } from '../../../../common-common/src/errors';
import { ServerThreadsController } from '../server_threads_controller';
import { PollAttributes } from '../../models/poll';
import { UserInstance } from '../../models/user';
import { AddressInstance } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { validateOwner } from '../../util/validateOwner';

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
  customDuration?: string;
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
  let finalCustomDuration: string | number = '';
  if (customDuration && customDuration !== 'Infinite') {
    finalCustomDuration = Number(finalCustomDuration);
    if (
      !Number.isInteger(finalCustomDuration) ||
      finalCustomDuration < 0 ||
      finalCustomDuration > 31
    ) {
      throw new AppError(Errors.InvalidDuration);
    }
  }
  const ends_at =
    finalCustomDuration === 'Infinite'
      ? null
      : finalCustomDuration
      ? moment().add(finalCustomDuration, 'days').toDate()
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
      { transaction }
    );
  });

  return poll.toJSON();
}
