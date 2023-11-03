import { Op } from 'sequelize';
import { AddressInstance } from 'server/models/address';
import { AppError } from '../../../../common-common/src/errors';
import { UserInstance } from '../../models/user';
import deleteThreadFromDb from '../../util/deleteThread';
import { findOneRole } from '../../util/roles';
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
      chain: thread.chain,
      address: address.address,
    });
    if (!canInteract) {
      throw new AppError(`Ban error: ${banError}`);
    }
  }

  // check ownership (bypass if admin)
  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const isAuthor = userOwnedAddressIds.includes(thread.Address.id);

  const isAdminOrMod = await findOneRole(
    this.models,
    { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
    thread.chain,
    ['admin', 'moderator'],
  );
  if (!isAuthor && !isAdminOrMod) {
    throw new AppError(Errors.NotOwned);
  }

  await deleteThreadFromDb(this.models, thread.id);
}
