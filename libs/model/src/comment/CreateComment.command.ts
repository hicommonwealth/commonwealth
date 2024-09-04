import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
// eslint-disable-next-line import/no-cycle
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export function CreateComment(): Command<typeof schemas.CreateTodo> {
  return {
    ...schemas.CreateTodo,
    auth: [],
    body: async ({ payload }) => {
      const comment = await models.Comment.findOne({
        where: { id: payload.id },
      });

      mustNotExist('Comment', comment);

      //await models.Comment.create(payload)
      return payload;
    },
  };
}
