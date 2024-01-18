import { z } from 'zod';
import { models } from '../database';
import type { ReactionAttributes } from '../models';
import type { Command } from '../types';

export const CreateReactionSchema = z.object({
  content: z.string(),
});

export type CreateReaction = z.infer<typeof CreateReactionSchema>;

export const createReaction: Command<
  typeof CreateReactionSchema,
  ReactionAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const reaction = await models.Reaction.findOne();
    return reaction!;
  };
