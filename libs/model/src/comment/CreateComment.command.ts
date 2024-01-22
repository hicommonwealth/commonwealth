import { z } from 'zod';
import { models } from '../database';
import type { CommentAttributes } from '../models';
import type { CommandMetadata } from '../types';

const schema = z.object({
  content: z.string(),
});

export const CreateComment: CommandMetadata<typeof schema, CommentAttributes> =
  {
    schema,
    fn: async () =>
      //actor,
      //id,
      //payload,
      {
        // TODO
        const comment = await models.Comment.findOne();
        return comment!;
      },
  };
