import { z } from 'zod';
import { AuthContext } from '../context';
import { Quest, QuestActionMeta } from '../entities';
import { PG_INT } from '../utils';

const QuestView = Quest.omit({ scheduled_job_id: true });

export const CreateQuest = {
  input: z.object({
    name: z.string(),
    description: z.string(),
    image_url: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    max_xp_to_end: z.number().default(0),
    community_id: z.string().nullish(),
    quest_type: z.enum(['channel', 'common']),
  }),
  output: QuestView,
  context: AuthContext,
};

export const UpdateQuest = {
  input: z.object({
    quest_id: PG_INT,
    name: z.string().optional(),
    description: z.string().optional(),
    community_id: z.string().optional(),
    image_url: z.string().optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    max_xp_to_end: z.number().optional(),
    action_metas: z.array(QuestActionMeta.omit({ quest_id: true })).optional(),
  }),
  output: QuestView,
  context: AuthContext,
};

export const DeleteQuest = {
  input: z.object({ quest_id: PG_INT }),
  output: z.boolean(),
  context: AuthContext,
};

export const CancelQuest = {
  input: z.object({ quest_id: PG_INT }),
  output: z.boolean(),
  context: AuthContext,
};
