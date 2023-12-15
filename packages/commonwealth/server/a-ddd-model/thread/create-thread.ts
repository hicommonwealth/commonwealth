import { z } from 'zod';
import db from '../../database';
import type { ThreadAttributes } from '../../models/thread';
import type { Command } from '../types';

export const CreateThreadSchema = z.object({
  content: z.string(),
});

export type CreateThread = z.infer<typeof CreateThreadSchema>;

export const createThread: Command<CreateThread, ThreadAttributes> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const thread = await db.Thread.findOne();
    return thread;
  };
