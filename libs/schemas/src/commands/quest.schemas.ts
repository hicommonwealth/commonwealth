import { z } from 'zod';

export const CreateQuest = {
  input: z.object({
    community_id: z.string(),
    name: z.string(),
    description: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
  }),
  output: z.object({
    community_id: z.string(),
    name: z.string(),
    description: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
  }),
};
