import { z } from 'zod/v4';

export const GoogleUser = z.object({
  email: z.string(),
  email_verified: z.boolean(),
});
