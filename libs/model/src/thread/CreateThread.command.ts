import { type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';
import type { ThreadAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateThread = (): CommandMetadata<
  ThreadAttributes,
  typeof schema
> => ({
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    const thread = await models.Thread.findOne({ where: { id } });

    mustNotExist('Thread', thread);

    //await models.Thread.create(payload)
    return payload as Partial<ThreadAttributes>;
  },
});
