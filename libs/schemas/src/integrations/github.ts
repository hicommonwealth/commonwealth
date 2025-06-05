import { z } from 'zod/v4';

export const GitHubUser = z.object({
  login: z.string(),
});
