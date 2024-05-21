import { z } from 'zod';
import { PG_INT } from '../utils';

export const permissionEnum = ['CREATE_THREAD', 'CREATE_COMMENT'] as const;
export type GroupPermissionType = typeof permissionEnum[number];

export const GroupPermission = z.object({
  group_id: PG_INT.optional(),
  type: z.enum(permissionEnum),
});
