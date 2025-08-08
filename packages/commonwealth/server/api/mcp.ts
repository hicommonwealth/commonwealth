import { trpc } from '@hicommonwealth/adapters';
import { MCP, MCPServer } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createKlavisMCPInstance: trpc.command(
    MCP.CreateKlavisMCPInstance,
    trpc.Tag.MCP,
  ),
  getPrivateCommunityMCPServers: trpc.query(
    MCPServer.GetPrivateCommunityMCPServers,
    trpc.Tag.MCP,
  ),
});
