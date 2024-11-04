import { z } from 'zod';
import { Quest } from '../entities';

export const CreateQuest = {
  input: z.object({
    community_id: z.string(),
    name: z.string(),
    description: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
  }),
  output: Quest,
};
