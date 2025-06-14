import { z } from 'zod';

export const MCPServer = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  handle: z.string(),
  source: z.string(),
  server_url: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const MCPServerCommunity = z.object({
  mcp_server_id: z.number(),
  community_id: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
