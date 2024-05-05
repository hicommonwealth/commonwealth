import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export function CreateComment(): Command<typeof schemas.CreateTodo> {
  return {
    ...schemas.CreateTodo,
    auth: [],
    body: async ({ id, payload }) => {
      const comment = await models.Comment.findOne({ where: { id } });

      mustNotExist('Comment', comment);

      //await models.Comment.create(payload)
      return payload;
    },
  };
}
