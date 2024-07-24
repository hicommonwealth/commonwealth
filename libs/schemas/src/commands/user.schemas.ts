import { z } from 'zod';
import { User } from '../entities';

export const TodoUserCommands = z.object({});

export const UpdateUser = {
  input: User.extend({
    promotional_emails_enabled: z.boolean().optional(),
    tag_ids: z.number().array().optional(),
  }),
  output: User,
};
