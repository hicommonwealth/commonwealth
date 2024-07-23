import { z } from 'zod';
import { UserProfile } from '../entities';

export const TodoUserCommands = z.object({});

export const UpdateNewProfileReq = UserProfile.extend({
  backgroundImage: z.string(),
  promotionalEmailsEnabled: z.boolean().optional(),
  tag_ids: z.number().array().optional(),
});
