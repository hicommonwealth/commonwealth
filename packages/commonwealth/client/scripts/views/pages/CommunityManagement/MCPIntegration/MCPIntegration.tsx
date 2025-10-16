import { DOCS_SUBDOMAIN } from '@hicommonwealth/shared';
import React, { useCallback, useMemo } from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useSetCommunityMcpServersMutation,
} from 'state/api/communities';
import { invalidateAllQueriesForCommunity } from 'state/api/communities/getCommuityById';
import { useFetchMcpServersQuery } from 'state/api/mcpServers';
import { trpc } from 'utils/trpcClient';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import './MCPIntegration.scss';
import MCPServerConnectionCard from './MCPServerConnectionCard';

const MCPIntegration = () => {
  const communityId = app.activeChainId() || '';

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
    includeMcpServers: true,
  });

  const { data: servers = [], isLoading } =
    useFetchMcpServersQuery(communityId);

  const utils = trpc.useUtils();
  const { mutateAsync: setServers, isPending } =
    useSetCommunityMcpServersMutation();

  const enabledIds = useMemo(
    () => community?.MCPServerCommunities?.map((s) => s.mcp_server_id) || [],
    [community?.MCPServerCommunities],
  );

  const onToggle = useCallback(
    async (serverId: number, enable: boolean) => {
      if (!communityId) return;
      const newIds = enable
        ? [...enabledIds, serverId]
        : enabledIds.filter((id) => id !== serverId);
      await setServers({ community_id: communityId, mcp_server_ids: newIds });
      await invalidateAllQueriesForCommunity(communityId);
      await utils.community.getCommunity.invalidate({
        id: communityId,
        include_node_info: false,
      });
    },
    [communityId, enabledIds, setServers, utils.community.getCommunity],
  );

  if (isLoading || !community) {
    return <CWCircleMultiplySpinner />;
  }

  return (
    <CWPageLayout>
      <section className="MCPIntegration">
        <div className="header-section">
          <CWText type="h2">Manage MCP Integrations</CWText>
          <CWText type="b1" className="description">
            Enable or disable Model Context Protocol servers to control the AI
            tools available in your community.{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://${DOCS_SUBDOMAIN}/commonwealth/ai-tools`}
            >
              Learn more
            </a>
            .
          </CWText>
        </div>

        {/* MCP Server Connections */}
        <MCPServerConnectionCard
          communityId={communityId}
          serverType="Google Sheets"
          serverName="Google Sheets MCP"
          description={
            'Connect Google Sheets to enable AI-powered spreadsheet ' +
            'interactions through the Model Context Protocol (MCP). This ' +
            'allows AI assistants to read and manipulate your Google Sheets data.'
          }
        />

        {/* Available MCP Servers */}
        <div className="servers-section">
          <CWText type="h3">Available MCP Servers</CWText>
          <div className="servers">
            {servers.map((server) => {
              const enabled = enabledIds.includes(server.id!);
              const description = server.auth_username
                ? `${server.description}\n\nConnected by ${server.auth_username}`
                : server.description;
              return (
                <CWCard
                  key={server.id}
                  className="server-card"
                  elevation="elevation-1"
                >
                  <div className="header">
                    <CWText type="h4">{server.name}</CWText>
                    <CWToggle
                      className="mcp-toggle"
                      checked={enabled}
                      disabled={isPending}
                      onChange={() => onToggle(server.id!, !enabled)}
                    />
                  </div>
                  <CWText type="b1">{description}</CWText>
                </CWCard>
              );
            })}
          </div>
        </div>
      </section>
    </CWPageLayout>
  );
};

export default MCPIntegration;
