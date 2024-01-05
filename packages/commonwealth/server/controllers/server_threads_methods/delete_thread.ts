import { AppError } from '../../../../common-common/src/errors';
import { AddressInstance } from '../../models/address';
import { UserInstance } from '../../models/user';
import deleteThreadFromDb from '../../util/deleteThread';
import { validateOwner } from '../../util/validateOwner';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  NotOwned: 'Not owned by this user',
};

export type DeleteThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  threadId?: number;
  messageId?: string;
};

export type DeleteThreadResult = void;

export async function __deleteThread(
  this: ServerThreadsController,
  { user, address, threadId, messageId }: DeleteThreadOptions,
): Promise<DeleteThreadResult> {
  if (!threadId) {
    // Special handling for discobot threads
    const existingThread = await this.models.Thread.findOne({
      where: {
        discord_meta: { message_id: messageId },
      },
    });
    if (existingThread) {
      threadId = existingThread.id;
    } else {
      throw new AppError(Errors.ThreadNotFound);
    }
  }

  // find thread
  const thread = await this.models.Thread.findOne({
    where: {
      id: threadId,
    },
    include: [{ model: this.models.Address, as: 'Address' }],
  });
  if (!thread) {
    throw new AppError(`${Errors.ThreadNotFound}: ${threadId}`);
  }

  if (address) {
    // check ban
    const [canInteract, banError] = await this.banCache.checkBan({
      communityId: thread.community_id,
      address: address.address,
    });
    if (!canInteract) {
      throw new AppError(`Ban error: ${banError}`);
    }
  }

  // check ownership (bypass if admin)
  const isOwnerOrAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: thread.community_id,
    entity: thread,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isOwnerOrAdmin) {
    throw new AppError(Errors.NotOwned);
  }

  await deleteThreadFromDb(this.models, thread.id);

  // use callbacks so route returns and this completes in the background
  if (this.globalActivityCache) {
    this.globalActivityCache.deleteActivityFromCache(thread.id);
  }
}
