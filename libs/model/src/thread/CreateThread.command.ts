import { z } from 'zod';
import { models } from '../database';
import type { ThreadAttributes } from '../models';
import type { CommandMetadata } from '../types';

export const schema = z.object({
  content: z.string(),
});

export const CreateThread: CommandMetadata<typeof schema, ThreadAttributes> = {
  schema,
  fn: async () =>
    //actor,
    //id,
    //payload,
    {
      // TODO
      const thread = await models.Thread.findOne();
      return thread!;
    },
};
