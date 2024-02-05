import type { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import type { ThreadAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateThread: CommandMetadata<ThreadAttributes, typeof schema> = {
  schema,
  load: [],
  body: async (context) => {
    context.state = await models.Thread.findOne();
    return context;
  },
  save: async (context) => {
    return context;
  },
};
