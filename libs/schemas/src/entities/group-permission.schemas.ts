import { z } from 'zod';
import { PG_INT } from '../utils';

export enum PermissionEnum {
  CREATE_THREAD = 'CREATE_THREAD',
  CREATE_COMMENT = 'CREATE_COMMENT',
  CREATE_THREAD_REACTION = 'CREATE_THREAD_REACTION',
  CREATE_COMMENT_REACTION = 'CREATE_COMMENT_REACTION',
  UPDATE_POLL = 'UPDATE_POLL',
}

export type GroupPermissionAction = keyof typeof PermissionEnum;

export const GroupPermission = z.object({
  group_id: PG_INT.optional(),
  allowed_actions: z.array(z.nativeEnum(PermissionEnum)),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});
