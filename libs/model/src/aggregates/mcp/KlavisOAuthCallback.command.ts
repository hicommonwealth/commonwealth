import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { KlavisClient } from 'klavis';
import { config } from '../../config';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function KlavisOAuthCallback(): Command<
  typeof schemas.KlavisOAuthCallback
> {
  return {
    ...schemas.KlavisOAuthCallback,
    auth: [],
    body: async ({ payload }) => {
      const { instanceId } = payload;

      const klavis = new KlavisClient({
        apiKey: config.KLAVIS.API_KEY,
      });

      const instance = await klavis.mcpServer.getServerInstance(instanceId);
      mustExist('Server name', instance);

      const userId = parseInt(instance.externalUserId ?? '0');
      if (!userId) {
        throw new Error('No user ID found for klavis instance');
      }

      const tools = await klavis.mcpServer.getTools(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        instance.serverName as unknown as any,
      );
      if (!tools.tools?.length) {
        throw new Error('No tools found for klavis instance');
      }

      // find existing MCP record
      const mcpServer = await models.MCPServer.findOne({
        where: {
          source: 'klavis',
          source_identifier: instance.instanceId,
          auth_required: true,
          auth_completed: false,
          auth_user_id: userId,
        },
      });
      mustExist('MCP Server', mcpServer);

      await mcpServer.update({
        tools: tools.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
        })),
        auth_completed: true,
      });
    },
  };
}
