import { z } from 'zod';
import { PG_INT } from '../utils';

export enum PermissionEnum {
  CREATE_THREAD = 'CREATE_THREAD',
  CREATE_COMMENT = 'CREATE_COMMENT',
  CREATE_REACTION = 'CREATE_REACTION',
  UPDATE_POLL = 'UPDATE_POLL',
}

export type GroupPermissionAction = keyof typeof PermissionEnum;

export const GroupPermission = z.object({
  group_id: PG_INT.optional(),
  allowed_actions: z.array(z.nativeEnum(PermissionEnum)),
});
