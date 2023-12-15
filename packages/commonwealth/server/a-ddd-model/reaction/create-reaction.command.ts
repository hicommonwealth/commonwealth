import { z } from 'zod';
import db from '../../database';
import type { ReactionAttributes } from '../../models/reaction';
import type { Command } from '../types';

export const CreateReaction = z.object({
  content: z.string(),
});

export const createReaction: Command<
  typeof CreateReaction,
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
