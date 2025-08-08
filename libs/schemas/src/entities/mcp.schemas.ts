import { z } from 'zod';
import { PG_INT } from '../utils';

export const MCPServer = z.object({
  id: PG_INT.optional(),
  name: z.string(),
  description: z.string(),
  handle: z.string(),
  source: z.string(),
  source_identifier: z.string().optional(), // required in DB but not in API
  server_url: z.string().optional(), // required in DB but not in API
  private_community_id: z.string().nullable().optional(),
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
  auth_required: z.boolean().default(false),
  auth_completed: z.boolean().default(false),
  auth_user_id: PG_INT.nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const MCPServerCommunity = z.object({
  mcp_server_id: PG_INT,
  community_id: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
