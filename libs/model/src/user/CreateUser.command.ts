import { InvalidInput, type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import type { UserAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateUser: CommandMetadata<UserAttributes, typeof schema> = {
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    const user = await models.User.findOne({ where: { id } });
    if (user) throw new InvalidInput('User already exists');
    //await models.User.create(payload)
    return payload as Partial<UserAttributes>;
  },
};
