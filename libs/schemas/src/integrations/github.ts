import { z } from 'zod';

export const GitHubUser = z.object({
  login: z.string(),
});
