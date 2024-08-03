import { AppError } from '@hicommonwealth/core';
import { AddressInstance, UserInstance } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import deleteThreadFromDb from '../../util/deleteThread';
import { validateOwner } from '../../util/validateOwner';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  NotOwned: 'Not owned by this user',
  ContestLock: 'Cannot edit thread that is in a contest',
};

export type DeleteThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  threadId?: number;
  threadMsgId?: string;
  messageId?: string;
  canvasSignedData?: string;
  canvasMsgId?: string;
};

export type DeleteThreadResult = void;

export async function __deleteThread(
  this: ServerThreadsController,
  { user, address, threadId, threadMsgId, messageId }: DeleteThreadOptions,
): Promise<DeleteThreadResult> {
  if (!threadId) {
    // Special handling for discobot threads
    const existingThread = await this.models.Thread.findOne({
      where: {
        discord_meta: { message_id: messageId },
      },
    });
    if (existingThread) {
      // @ts-expect-error StrictNullChecks
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

  // if the threadMsgId is given, validate that it is the same as the field on
  // the thread to be deleted
  if (threadMsgId && thread.canvas_msg_id !== threadMsgId) {
    throw new AppError(
      `thread.canvas_msg_id (${thread.canvas_msg_id}) !== threadMsgId (${threadMsgId})`,
    );
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
    allowSuperAdmin: true,
  });
  if (!isOwnerOrAdmin) {
    throw new AppError(Errors.NotOwned);
  }

  // check if thread is part of a contest topic
  const contestManagers = await this.models.sequelize.query(
    `
    SELECT cm.contest_address FROM "Threads" t
    JOIN "ContestTopics" ct on ct.topic_id = t.topic_id
    JOIN "ContestManagers" cm on cm.contest_address = ct.contest_address
    WHERE t.id = :thread_id
  `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        thread_id: thread!.id,
      },
    },
  );
  if (contestManagers.length > 0) {
    throw new AppError(Errors.ContestLock);
  }

  await this.models.sequelize.transaction(async (transaction) => {
    await deleteThreadFromDb(this.models, thread, transaction);
  });

  // use callbacks so route returns and this completes in the background
  if (this.globalActivityCache) {
    // @ts-expect-error StrictNullChecks
    this.globalActivityCache.deleteActivityFromCache(thread.id);
  }
}
