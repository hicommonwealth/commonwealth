import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { getBaseUrl } from '@hicommonwealth/shared';
import axios from 'axios';
import { KlavisClient } from 'klavis';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';

export function GetKlavisMCPOAuthURL(): Query<
  typeof schemas.GetKlavisMCPOAuthURL
> {
  return {
    ...schemas.GetKlavisMCPOAuthURL,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { server_name, community_id, original_url } = payload;

      if (!config.KLAVIS.API_KEY) {
        throw new Error('KLAVIS_API_KEY not configured');
      }

      try {
        // Find existing mcp server with this name
        // and confirm it's a private server for the specified community
        const existingServer = await models.MCPServer.scope(
          'withPrivateData',
        ).findOne({
          where: {
            name: server_name,
            source: 'klavis',
            private_community_id: community_id,
          },
        });

        if (!existingServer) {
          throw new Error(
            'MCP server does not exist or is not associated with this community',
          );
        }

        if (!existingServer.source_identifier) {
          throw new Error('MCP server is missing source identifier');
        }

        const klavis = new KlavisClient({
          apiKey: config.KLAVIS.API_KEY,
        });

        // Get the server instance from Klavis
        const instance = await klavis.mcpServer.getServerInstance(
          existingServer.source_identifier,
        );
        mustExist('Instance ID', instance?.instanceId);

        const baseUrl = getBaseUrl(config.APP_ENV);

        // Get OAuth URL for the existing instance
        const { oauthUrl } = await klavis.mcpServer.getOAuthUrl({
          serverName: existingServer.name as 'Google Sheets',
          instanceId: instance.instanceId,
          redirectUrl:
            `${baseUrl}/api/integration/klavis/oauth-callback?` +
            `instanceId=${instance.instanceId}&original_url=${original_url}`,
        });

        return {
          oauthUrl: oauthUrl,
        };
      } catch (error) {
        console.error('Failed to get Klavis MCP OAuth URL:', error);

        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || error.message;
          throw new Error(`Failed to get MCP OAuth URL: ${message}`);
        }

        throw new Error(
          `Failed to get MCP OAuth URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  };
}
