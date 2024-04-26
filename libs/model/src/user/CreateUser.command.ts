import { schemas, type Command } from '@hicommonwealth/core';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export const CreateUser: Command<typeof schemas.commands.CreateTodo> = () => ({
  ...schemas.commands.CreateTodo,
  auth: [],
  body: async ({ id, payload }) => {
    const user = await models.User.findOne({ where: { id } });

    mustNotExist('User', user);

    //await models.User.create(payload)
    return payload;
  },
});
