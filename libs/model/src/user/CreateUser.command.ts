import { type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { MustNotExist } from '../middleware/invariants';
import type { UserAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateUser: CommandMetadata<UserAttributes, typeof schema> = {
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    const user = await models.User.findOne({ where: { id } });

    MustNotExist('User', user);

    //await models.User.create(payload)
    return payload as Partial<UserAttributes>;
  },
};
