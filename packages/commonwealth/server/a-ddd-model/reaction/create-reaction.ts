import { z } from 'zod';
import db from '../../database';
import type { ReactionAttributes } from '../../models/reaction';
import type { Command } from '../types';

export const CreateReactionSchema = z.object({
  content: z.string(),
});

export type CreateReaction = z.infer<typeof CreateReactionSchema>;

export const createReaction: Command<
  CreateReaction,
  ReactionAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const reaction = await db.Reaction.findOne();
    return reaction;
  };
