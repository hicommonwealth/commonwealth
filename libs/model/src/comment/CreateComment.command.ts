import { InvalidInput, type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import type { CommentAttributes } from '../models';

const schema = z.object({
  content: z.string(),
});

export const CreateComment: CommandMetadata<CommentAttributes, typeof schema> =
  {
    schema,
    auth: [],
    body: async ({ id, payload }) => {
      const comment = await models.Comment.findOne({ where: { id } });
      if (comment) throw new InvalidInput('Comment already exists');
      //await models.Comment.create(payload)
      return payload as Partial<CommentAttributes>;
    },
  };
