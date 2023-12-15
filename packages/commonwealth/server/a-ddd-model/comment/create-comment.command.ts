import { z } from 'zod';
import db from '../../database';
import type { CommentAttributes } from '../../models/comment';
import type { Command } from '../types';

export const CreateComment = z.object({
  content: z.string(),
});

export const createComment: Command<
  typeof CreateComment,
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
