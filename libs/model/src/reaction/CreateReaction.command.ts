import { schemas, type Command } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export const schema = z.object({
  content: z.string(),
});

export const CreateReaction: Command<
  typeof schemas.commands.CreateTodo
> = () => ({
  ...schemas.commands.CreateTodo,
  auth: [],
  body: async ({ id, payload }) => {
    const reaction = await models.Reaction.findOne({ where: { id } });

    mustNotExist('Reaction', reaction);

    //await models.Reaction.create(payload)
    return payload;
  },
});
