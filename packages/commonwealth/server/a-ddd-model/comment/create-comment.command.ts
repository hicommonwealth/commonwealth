import { z } from 'zod';
import db from '../../database';
import type { CommentAttributes } from '../../models/comment';
import type { Command } from '../types';

export const CreateCommentSchema = z.object({
  content: z.string(),
});

export type CreateComment = z.infer<typeof CreateCommentSchema>;

export const createComment: Command<
  CreateComment,
  CommentAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const comment = await db.Comment.findOne();
    return comment;
  };
