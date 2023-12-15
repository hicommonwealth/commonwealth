import { z } from 'zod';
import db from '../../database';
import type { UserAttributes } from '../../models/user';
import type { Command } from '../types';

export const CreateUser = z.object({
  content: z.string(),
});

export const createUser: Command<
  typeof CreateUser,
  UserAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const user = await db.User.findOne();
    return user;
  };
