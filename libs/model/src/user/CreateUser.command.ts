import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
// eslint-disable-next-line import/no-cycle
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export function CreateUser(): Command<typeof schemas.CreateTodo> {
  return {
    ...schemas.CreateTodo,
    auth: [],
    body: async ({ payload }) => {
      const user = await models.User.findOne({ where: { id: payload.id } });

      mustNotExist('User', user);

      //await models.User.create(payload)
      return payload;
    },
  };
}
