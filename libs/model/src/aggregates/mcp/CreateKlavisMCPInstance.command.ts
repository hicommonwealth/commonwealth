import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { getBaseUrl } from '@hicommonwealth/shared';
import axios from 'axios';
import { KlavisClient } from 'klavis';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';

export function CreateKlavisMCPInstance(): Command<
  typeof schemas.CreateKlavisMCPInstance
> {
  return {
    ...schemas.CreateKlavisMCPInstance,
    auth: [authRoles('admin')],
    body: async ({ actor, payload }) => {
      const { community_id, serverType, original_url } = payload;

      if (!actor.user?.id) {
        throw new Error('User must be authenticated');
      }

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
          platformName: `common_${config.APP_ENV}`,
        });
        mustExist('Instance', instance);

        const baseUrl = getBaseUrl(config.APP_ENV);

        const { oauthUrl } = await klavis.mcpServer.getOAuthUrl({
          serverName: serverType,
          instanceId: instance.instanceId,
          redirectUrl: `${baseUrl}/api/integration/klavis/oauth-callback?instanceId=${instance.instanceId}&original_url=${original_url}`,
        });

        switch (serverType) {
          case 'Google Sheets':
            await models.MCPServer.create({
              name: serverType,
              description: serverType,
              handle: 'google_sheets',
              source: 'klavis',
              source_identifier: instance.instanceId,
              server_url: instance.serverUrl,
              tools: [],
              private_community_id: community_id,
              auth_required: true,
              auth_completed: false,
              auth_user_id: actor.user.id,
            });
            break;
          default:
            throw new Error(`Unsupported server type: ${serverType}`);
        }

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
