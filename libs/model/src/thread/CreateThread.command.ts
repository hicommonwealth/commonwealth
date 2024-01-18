import { z } from 'zod';
import { models } from '../database';
import type { ThreadAttributes } from '../models';
import type { Command } from '../types';

export const CreateThreadSchema = z.object({
  content: z.string(),
});

export type CreateThread = z.infer<typeof CreateThreadSchema>;

export const createThread: Command<
  typeof CreateThreadSchema,
  ThreadAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const thread = await models.Thread.findOne();
    return thread!;
  };
