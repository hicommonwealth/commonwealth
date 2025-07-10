import React, { useCallback } from 'react';
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

const MCPIntegration = () => {
  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
    includeMcpServers: true,
  });

  const { data: servers = [], isLoading } = useFetchMcpServersQuery();
  const utils = trpc.useUtils();
  const { mutateAsync: setServers, isPending } =
    useSetCommunityMcpServersMutation();

  const enabledIds =
    community?.MCPServerCommunities?.map((s) => s.mcp_server_id) || [];

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
        <CWText type="h2">Manage MCP Integrations</CWText>
        <div className="servers">
          {servers.map((server) => {
            const enabled = enabledIds.includes(server.id);
            return (
              <CWCard
                key={server.id}
                className="server-card"
                elevation="elevation-1"
              >
                <div className="header">
                  <CWText type="h4">{server.name}</CWText>
                  <CWToggle
                    checked={enabled}
                    disabled={isPending}
                    onChange={() => onToggle(server.id, !enabled)}
                  />
                </div>
                <CWText type="b1">{server.description}</CWText>
              </CWCard>
            );
          })}
        </div>
      </section>
    </CWPageLayout>
  );
};

export default MCPIntegration;
