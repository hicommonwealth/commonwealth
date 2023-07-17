import { UserInstance } from '../../models/user';
import { ServerThreadsController } from '../server_threads_controller';
import { ThreadAttributes } from '../../models/thread';
import { validateOwner } from '../../util/validateOwner';

const Errors = {
  ThreadNotFound: 'Thread not found',
  InvalidPermissions: 'Invalid permissions',
};

export type ArchiveOrUnarchiveThreadOptions = {
  user: UserInstance;
  threadId: string;
  shouldArchive: boolean;
};

export type ArchiveOrUnarchiveThreadResult = ThreadAttributes;

export async function __archiveOrUnarchiveThread(
  this: ServerThreadsController,
  { user, threadId, shouldArchive }: ArchiveOrUnarchiveThreadOptions
): Promise<ArchiveOrUnarchiveThreadResult> {
  const thread = await this.models.Thread.findOne({
    where: {
      id: threadId,
    },
  });
  if (!thread) {
    throw new Error(Errors.ThreadNotFound);
  }

  const isOwner = await validateOwner({
    models: this.models,
    user,
    chainId: thread.chain,
    entity: thread,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });

  if (!isOwner) {
    throw new Error(Errors.InvalidPermissions);
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
