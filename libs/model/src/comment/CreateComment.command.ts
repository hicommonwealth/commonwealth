import { schemas, type Command } from '@hicommonwealth/core';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export const CreateComment: Command<
  typeof schemas.commands.CreateTodo
> = () => ({
  ...schemas.commands.CreateTodo,
  auth: [],
  body: async ({ id, payload }) => {
    const comment = await models.Comment.findOne({ where: { id } });

    mustNotExist('Comment', comment);

    //await models.Comment.create(payload)
    return payload;
  },
});
