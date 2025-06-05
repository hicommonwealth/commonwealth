import { z } from 'zod/v4';

export const CreateJWTs = {
  input: z.object({
    id: z.number(),
    number_of_jwt: z.coerce.number().int().min(1).max(10_000),
  }),
  output: z.array(z.string()),
};
