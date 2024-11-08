import { z } from 'zod';
import { AuthContext } from '../context';
import { Quest } from '../entities';
import { PG_INT } from '../utils';

export const QuestView = Quest.extend({
  id: PG_INT,
  start_date: z.coerce.date().or(z.string()),
  end_date: z.coerce.date().or(z.string()),
  created_at: z.coerce.date().or(z.string()),
  updated_at: z.coerce.date().or(z.string()).optional(),
});

export const GetQuest = {
  input: z.object({ community_id: z.string(), quest_id: PG_INT }),
  output: QuestView.optional(),
  context: AuthContext,
};
