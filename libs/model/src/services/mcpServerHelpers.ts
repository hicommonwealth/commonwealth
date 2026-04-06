import { MCPServer } from '@hicommonwealth/schemas';
import { z } from 'zod';
import type { MCPServerInstance } from '../models/mcp_server';

export function withMCPAuthUsername(
  server: MCPServerInstance,
): z.infer<typeof MCPServer> {
  const serverJson = server.toJSON() as Record<string, unknown>;

  // Add auth_username as a dynamic property
  if (server.auth_user_id && serverJson.AuthUser) {
    const authUser = serverJson.AuthUser as { profile?: { name?: string } };
    serverJson.auth_username =
      authUser.profile?.name || `user #${server.auth_user_id}`;
  }

  // Remove AuthUser from response
  delete serverJson.AuthUser;

  return serverJson as z.infer<typeof MCPServer>;
}
