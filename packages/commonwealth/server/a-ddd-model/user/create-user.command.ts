import { z } from 'zod';
import db from '../../database';
import type { UserAttributes } from '../../models/user';
import type { Command } from '../types';

export const CreateUserSchema = z.object({
  content: z.string(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const createUser: Command<CreateUser, UserAttributes> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const user = await db.User.findOne();
    return user;
  };
