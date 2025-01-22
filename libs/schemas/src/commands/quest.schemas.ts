import { z } from 'zod';
import { AuthContext } from '../context';
import { Quest, QuestActionMeta } from '../entities';
import { PG_INT } from '../utils';

export const CreateQuest = {
  input: z.object({
    name: z.string(),
    description: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    community_id: z.string().nullish(),
  }),
  output: Quest,
  context: AuthContext,
};

export const UpdateQuest = {
  input: z.object({
    quest_id: PG_INT,
    name: z.string().optional(),
    description: z.string().optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    action_metas: z.array(QuestActionMeta.omit({ quest_id: true })).optional(),
  }),
  output: Quest,
  context: AuthContext,
};

export const DeleteQuest = {
  input: z.object({ quest_id: PG_INT }),
  output: z.boolean(),
  context: AuthContext,
};
