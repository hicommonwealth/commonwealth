import { z } from 'zod';

export const CreateJWTs = {
  input: z.object({
    number_of_jwt: z.coerce.number().int().min(1).max(10_000),
  }),
  output: z.array(z.string()),
};
