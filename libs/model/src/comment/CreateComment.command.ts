import type { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import type { CommentAttributes } from '../models';

const schema = z.object({
  content: z.string(),
});

export const CreateComment: CommandMetadata<CommentAttributes, typeof schema> =
  {
    schema,
    load: [],
    body: async (context) => {
      context.state = await models.Comment.findOne();
      return context;
    },
    save: async (context) => {
      return context;
    },
  };
