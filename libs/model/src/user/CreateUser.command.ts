import { z } from 'zod';
import { models } from '../database';
import type { UserAttributes } from '../models';
import type { Command } from '../types';

export const CreateUserSchema = z.object({
  content: z.string(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const createUser: Command<
  typeof CreateUserSchema,
  UserAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const user = await models.User.findOne();
    return user!;
  };
