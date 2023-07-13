import { UserInstance } from '../../models/user';
import { findOneRole } from '../../util/roles';
import { ServerThreadsController } from '../server_threads_controller';
import { Op } from 'sequelize';
import deleteThreadFromDb from '../../util/deleteThread';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  NotOwned: 'Not owned by this user',
};

export type DeleteThreadOptions = {
  user: UserInstance;
  threadId: number;
};

export type DeleteThreadResult = void;

export async function __deleteThread(
  this: ServerThreadsController,
  { user, threadId }
): Promise<DeleteThreadResult> {
  // find thread
  const thread = await this.models.Thread.findOne({
    where: {
      id: threadId,
    },
    include: [{ model: this.models.Address, as: 'Address' }],
  });
  if (!thread) {
    throw new Error(`${Errors.ThreadNotFound}: ${threadId}`);
  }

  // check ban
  const [canInteract, banError] = await this.banCache.checkBan({
    chain: thread.chain,
    address: thread.Address.address,
  });
  if (!canInteract) {
    throw new Error(`Ban error: ${banError}`);
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
    ['admin', 'moderator']
  );
  if (!isAuthor && !isAdminOrMod) {
    throw new Error(Errors.NotOwned);
  }

  await deleteThreadFromDb(this.models, thread.id);
}
