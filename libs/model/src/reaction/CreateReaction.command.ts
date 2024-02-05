import type { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import type { ReactionAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateReaction: CommandMetadata<
  ReactionAttributes,
  typeof schema
> = {
  schema,
  load: [],
  body: async (context) => {
    context.state = await models.Reaction.findOne();
    return context;
  },
  save: async (context) => {
    return context;
  },
};
