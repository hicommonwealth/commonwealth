import { type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';
import type { UserAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateUser: CommandMetadata<UserAttributes, typeof schema> = {
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    const user = await models.User.findOne({ where: { id } });

    mustNotExist('User', user);

    //await models.User.create(payload)
    return payload as Partial<UserAttributes>;
  },
};
