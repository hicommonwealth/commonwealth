import { z } from 'zod';

export const GoogleUser = z.object({
  email: z.string(),
  email_verified: z.boolean(),
});
