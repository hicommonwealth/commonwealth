import { todo, type Command } from '@hicommonwealth/core';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export const CreateThread: Command<typeof todo.CreateTodo> = () => ({
  ...todo.CreateTodo,
  auth: [],
  body: async ({ id, payload }) => {
    const thread = await models.Thread.findOne({ where: { id } });

    mustNotExist('Thread', thread);

    //await models.Thread.create(payload)
    return payload;
  },
});
