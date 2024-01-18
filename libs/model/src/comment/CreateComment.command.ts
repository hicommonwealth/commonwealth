import { z } from 'zod';
import { models } from '../database';
import type { CommentAttributes } from '../models';
import type { Command } from '../types';

export const CreateCommentSchema = z.object({
  content: z.string(),
});

export type CreateComment = z.infer<typeof CreateCommentSchema>;

export const createComment: Command<
  typeof CreateCommentSchema,
  CommentAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const comment = await models.Comment.findOne();
    return comment!;
  };
