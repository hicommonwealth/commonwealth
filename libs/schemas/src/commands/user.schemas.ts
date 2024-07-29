import { z } from 'zod';
import { User } from '../entities';

export const TodoUserCommands = z.object({});

export const UpdateUser = {
  input: User.omit({ is_welcome_onboard_flow_complete: true }).extend({
    promotional_emails_enabled: z.boolean().nullish(),
    tag_ids: z.number().array().nullish(),
  }),
  output: User,
};
