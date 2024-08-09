import { z } from 'zod';
import { PG_INT } from '../utils';

export enum ForumActionsEnum {
  CREATE_THREAD = 'CREATE_THREAD',
  CREATE_COMMENT = 'CREATE_COMMENT',
  CREATE_THREAD_REACTION = 'CREATE_THREAD_REACTION',
  CREATE_COMMENT_REACTION = 'CREATE_COMMENT_REACTION',
  UPDATE_POLL = 'UPDATE_POLL',
}

export type ForumActions = keyof typeof ForumActionsEnum;

export const GroupPermission = z.object({
  group_id: PG_INT.optional(),
  topic_id: PG_INT.optional(),
  allowed_actions: z.array(z.nativeEnum(ForumActionsEnum)),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});
