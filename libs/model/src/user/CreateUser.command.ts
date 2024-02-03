import type { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import type { UserAttributes } from '../models';

export const schema = z.object({
  content: z.string(),
});

export const CreateUser: CommandMetadata<
  UserAttributes,
  typeof schema,
  UserAttributes
> = {
  schema,
  fn: async () =>
    //actor,
    //id,
    //payload,
    {
      // TODO
      const user = await models.User.findOne();
      return user!;
    },
};
