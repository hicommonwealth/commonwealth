import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import axios from 'axios';
import { KlavisClient } from 'klavis';
import { config } from '../../config';

export function CreateKlavisMCPInstance(): Command<
  typeof schemas.CreateKlavisMCPInstance
> {
  return {
    ...schemas.CreateKlavisMCPInstance,
    auth: [],
    body: async ({ actor, payload }) => {
      const { serverType } = payload;

      // Ensure user is authenticated
      if (!actor.user?.id) {
        throw new Error('User must be authenticated');
      }

      // Ensure API key is configured
      if (!config.KLAVIS.API_KEY) {
        throw new Error('KLAVIS_API_KEY not configured');
      }

      try {
        const klavis = new KlavisClient({
          apiKey: config.KLAVIS.API_KEY,
        });

        const instance = await klavis.mcpServer.createServerInstance({
          serverName: serverType,
          userId: actor.user.id.toString(),
          platformName: 'Common',
        });

        const { oauthUrl } = await klavis.mcpServer.getOAuthUrl({
          serverName: serverType,
          instanceId: instance.instanceId,
          redirectUrl: `${config.KLAVIS.REDIRECT_URL}/api/integration/klavis/oauth-callback?instanceId=${instance.instanceId}`,
        });

        return {
          serverUrl: instance.serverUrl,
          instanceId: instance.instanceId,
          oauthUrl: oauthUrl,
        };
      } catch (error) {
        console.error('Failed to create Klavis MCP instance:', error);

        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || error.message;
          throw new Error(`Failed to create MCP instance: ${message}`);
        }

        throw new Error('Failed to create MCP instance');
      }
    },
  };
}
