import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export function CreateReaction(): Command<typeof schemas.CreateTodo> {
  return {
    ...schemas.CreateTodo,
    auth: [],
    body: async ({ id, payload }) => {
      const reaction = await models.Reaction.findOne({ where: { id } });

      mustNotExist('Reaction', reaction);

      //await models.Reaction.create(payload)
      return payload;
    },
  };
}
