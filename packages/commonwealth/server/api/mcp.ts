import { trpc } from '@hicommonwealth/adapters';
import { MCP } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createKlavisMCPInstance: trpc.command(
    MCP.CreateKlavisMCPInstance,
    trpc.Tag.MCP,
  ),
  getKlavisMCPOAuthURL: trpc.query(MCP.GetKlavisMCPOAuthURL, trpc.Tag.MCP),
  getCommunityMcpServers: trpc.query(MCP.GetCommunityMCPServers, trpc.Tag.MCP),
});
