import { UserInstance } from '../../models/user';
import { ServerThreadsController } from '../server_threads_controller';
import { ThreadAttributes } from '../../models/thread';
import { findAllRoles } from '../../util/roles';
import { Op } from 'sequelize';

const Errors = {
  ThreadNotFound: 'Thread not found',
  NotAdmin: 'Not an admin',
};

export type ArchiveOrUnarchiveThreadOptions = {
  user: UserInstance;
  threadId: string;
  shouldArchive: boolean;
};

export type ArchiveOrUnarchiveThreadResult = ThreadAttributes;

export async function __archiveOrUnarchiveThread(
  this: ServerThreadsController,
  options: ArchiveOrUnarchiveThreadOptions
): Promise<ArchiveOrUnarchiveThreadResult> {
  const { user, threadId, shouldArchive } = options;

  const thread = await this.models.Thread.findOne({
    where: {
      id: threadId,
    },
  });
  if (!thread) {
    throw new Error(Errors.ThreadNotFound);
  }
  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(thread.address_id) && !user.isAdmin) {
    // is not author or site admin
    const roles = await findAllRoles(
      this.models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      thread.chain,
      ['admin', 'moderator']
    );
    const role = roles.find((r) => {
      return r.chain_id === thread.chain;
    });
    if (!role) {
      throw new Error(Errors.NotAdmin);
    }
  }

  await thread.update({
    archived_at: shouldArchive
      ? this.models.Sequelize.literal('CURRENT_TIMESTAMP')
      : null,
  });

  // get thread with updated timestamp
  const updatedThread = await this.models.Thread.findOne({
    where: {
      id: thread.id,
    },
  });

  return updatedThread;
}
