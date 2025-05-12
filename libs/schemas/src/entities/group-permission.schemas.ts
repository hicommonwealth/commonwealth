import { z } from 'zod';
import { PG_INT } from '../utils';

export enum GatedActionEnum {
  CREATE_THREAD = 'CREATE_THREAD',
  CREATE_COMMENT = 'CREATE_COMMENT',
  CREATE_THREAD_REACTION = 'CREATE_THREAD_REACTION',
  CREATE_COMMENT_REACTION = 'CREATE_COMMENT_REACTION',
  UPDATE_POLL = 'UPDATE_POLL',
}

export type GroupPermissionAction = keyof typeof GatedActionEnum;

export const GroupGatedAction = z.object({
  group_id: PG_INT,
  topic_id: PG_INT,
  gated_actions: z.array(z.nativeEnum(GatedActionEnum)),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
