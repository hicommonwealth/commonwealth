import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export function CreateUser(): Command<typeof schemas.CreateTodo> {
  return {
    ...schemas.CreateTodo,
    auth: [],
    body: async ({ id, payload }) => {
      const user = await models.User.findOne({ where: { id } });

      mustNotExist('User', user);

      //await models.User.create(payload)
      return payload;
    },
  };
}
