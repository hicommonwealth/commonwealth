import { z } from 'zod';
import { AuthContext } from '../context';
import { Quest, QuestActionMeta } from '../entities';
import { PG_INT } from '../utils';

export const CreateQuest = {
  input: z.object({
    community_id: z.string(),
    name: z.string(),
    description: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
  }),
  output: Quest,
  context: AuthContext,
};

export const UpdateQuest = {
  input: z.object({
    community_id: z.string(),
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
  input: z.object({
    community_id: z.string(),
    quest_id: PG_INT,
  }),
  output: z.boolean(),
  context: AuthContext,
};
