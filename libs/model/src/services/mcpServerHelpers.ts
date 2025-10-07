import { MCPServer } from '@hicommonwealth/schemas';
import { z } from 'zod';
import type { MCPServerInstance } from '../models/mcp_server';

export function withMCPAuthUsername(
  server: MCPServerInstance,
): z.infer<typeof MCPServer> {
  const serverJson = server.toJSON() as any;

  // Dynamically interpolate username in description
  if (server.auth_user_id && serverJson.AuthUser) {
    const userName =
      serverJson.AuthUser.profile?.name || `user #${server.auth_user_id}`;
    // Append username to the description
    serverJson.description = `${serverJson.description} connected by ${userName}`;
  }

  // Remove AuthUser from response
  delete serverJson.AuthUser;

  return serverJson;
}
