import { type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { MustNotExist } from '../middleware/invariants';
import type { ReactionAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateReaction: CommandMetadata<
  ReactionAttributes,
  typeof schema
> = {
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    const reaction = await models.Reaction.findOne({ where: { id } });

    MustNotExist('Reaction', reaction);

    //await models.Reaction.create(payload)
    return payload as Partial<ReactionAttributes>;
  },
};
