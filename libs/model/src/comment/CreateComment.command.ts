import { todo, type CommandMetadata } from '@hicommonwealth/core';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export const CreateComment = (): CommandMetadata<typeof todo.CreateTodo> => ({
  schemas: todo.CreateTodo,
  auth: [],
  body: async ({ id, payload }) => {
    const comment = await models.Comment.findOne({ where: { id } });

    mustNotExist('Comment', comment);

    //await models.Comment.create(payload)
    return payload;
  },
});
