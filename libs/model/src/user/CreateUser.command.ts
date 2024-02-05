import type { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import type { UserAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateUser: CommandMetadata<UserAttributes, typeof schema> = {
  schema,
  load: [],
  body: async (context) => {
    context.state = await models.User.findOne();
    return context;
  },
  save: async (context) => {
    return context;
  },
};
