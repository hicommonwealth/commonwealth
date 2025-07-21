import { trpc } from '@hicommonwealth/adapters';
import { MCP } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createKlavisMCPInstance: trpc.command(
    MCP.CreateKlavisMCPInstance,
    trpc.Tag.MCP,
  ),
});
