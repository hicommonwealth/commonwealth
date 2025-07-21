import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import axios from 'axios';
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
        const response = await axios.post(
          'https://api.klavis.ai/mcp-server/instance/create',
          {
            serverName: serverType,
            userId: actor.user.id.toString(),
            platformName: 'Common',
            connectionType: 'StreamableHttp',
          },
          {
            headers: {
              Authorization: `Bearer ${config.KLAVIS.API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const { serverUrl, instanceId, oauthUrl } = response.data;

        return {
          serverUrl,
          instanceId,
          oauthUrl,
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
