import { trpc } from '@hicommonwealth/adapters';
import { MCPServer } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getAllMcpServers: trpc.query(MCPServer.GetAllMCPServers, trpc.Tag.Bot),
});

