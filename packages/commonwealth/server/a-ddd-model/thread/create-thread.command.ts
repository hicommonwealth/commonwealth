import { z } from 'zod';
import db from '../../database';
import type { ThreadAttributes } from '../../models/thread';
import type { Command } from '../types';

export const CreateThread = z.object({
  content: z.string(),
});

export const createThread: Command<
  typeof CreateThread,
  ThreadAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const thread = await db.Thread.findOne();
    return thread;
  };
