import { type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { MustNotExist } from '../middleware/invariants';
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

      MustNotExist('Comment', comment);

      //await models.Comment.create(payload)
      return payload as Partial<CommentAttributes>;
    },
  };
