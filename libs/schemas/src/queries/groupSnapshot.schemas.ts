import { z } from 'zod';
import { AuthContext } from '../context';
import { GroupSnapshot } from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const ListGroupSnapshots = {
  input: PaginationParamsSchema.extend({
    groupId: z.number(),
    status: z.enum(['active', 'error', 'superseded']).optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(GroupSnapshot),
  }),
  context: AuthContext,
};

export const GetGroupSnapshot = {
  input: z.object({
    snapshotId: z.number(),
  }),
  output: GroupSnapshot.nullable(),
  context: AuthContext,
};

export const GetSnapshotBalances = {
  input: z.object({
    groupId: z.number(),
    snapshotId: z.number().optional(),
    address: z.string().optional(),
  }),
  output: z
    .object({
      balances: z.record(z.string()),
      snapshotId: z.number(),
      groupId: z.number(),
    })
    .nullable(),
  context: AuthContext,
};
