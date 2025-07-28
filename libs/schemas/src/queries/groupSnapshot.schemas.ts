import { z } from 'zod';
import { AuthContext } from '../context';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const GroupSnapshotView = z.object({
  id: z.number(),
  group_id: z.number(),
  block_height: z.bigint().nullable(),
  snapshot_source: z.string(),
  balance_map: z.record(z.string()),
  status: z.enum(['pending', 'active', 'error', 'superseded']),
  error_message: z.string().nullable(),
  snapshot_date: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ListGroupSnapshots = {
  input: PaginationParamsSchema.extend({
    groupId: z.number(),
    status: z.enum(['pending', 'active', 'error', 'superseded']).optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(GroupSnapshotView),
  }),
  context: AuthContext,
};

export const GetGroupSnapshot = {
  input: z.object({
    snapshotId: z.number(),
  }),
  output: GroupSnapshotView.nullable(),
  context: AuthContext,
};
