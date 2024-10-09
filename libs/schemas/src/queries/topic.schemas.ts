import { z } from 'zod';
import { Topic } from '../entities';
import * as schemas from '../index';
import { PG_INT, zBoolean } from '../utils';

export const GetTopics = {
  input: z.object({
    community_id: z.string(),
    topic_id: PG_INT.optional(),
    include_threads: zBoolean.default(false),
    include_contest_managers: zBoolean.default(false),
  }),
  output: Topic.extend({
    id: z.number(),
    total_threads: z.number(),
    active_contest_managers: z.array(
      schemas.ContestManager.extend({
        content: z.array(schemas.ContestAction),
        contest_manager: schemas.ContestManager,
      }),
    ),
  }).array(),
};
