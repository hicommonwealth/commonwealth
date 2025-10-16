import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { trpc } from 'utils/trpcClient';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './MCPServerConnectionCard.scss';

interface MCPServerConnectionCardProps {
  communityId: string;
  serverType: 'Google Sheets';
  serverName: string;
  description: string;
}

const MCPServerConnectionCard = ({
  communityId,
  serverType,
  serverName,
  description,
}: MCPServerConnectionCardProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: privateMcpServers = [], isLoading: isLoadingPrivate } =
    trpc.mcp.getCommunityMcpServers.useQuery(
      { community_id: communityId, private_only: true },
      { enabled: !!communityId },
    );

  const createKlavisMCPInstanceMutation =
    trpc.mcp.createKlavisMCPInstance.useMutation({
      onSuccess: (data) => {
        setIsConnecting(false);
        notifySuccess(`Redirecting to ${serverName} OAuth...`);
        window.location.href = data.oauthUrl;
      },
      onError: (error) => {
        setIsConnecting(false);
        notifyError(`Failed to connect ${serverName}: ${error.message}`);
      },
    });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await createKlavisMCPInstanceMutation.mutateAsync({
        community_id: communityId,
        serverType,
        original_url: window.location.href,
      });
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  console.log('privateMcpServers', { privateMcpServers });

  const existingServer = privateMcpServers.find(
    (server) => server.name === serverType,
  );

  const connectedServer = privateMcpServers.find(
    (server) => server.name === serverType && server.auth_completed,
  );

  const connectionStatus = isLoadingPrivate
    ? 'Loading...'
    : connectedServer
      ? 'Connected'
      : existingServer
        ? 'Pending authentication'
        : 'Not connected';

  return (
    <CWCard className="MCPServerConnectionCard" elevation="elevation-1">
      <div className="card-header">
        <CWText type="h4">{serverName}</CWText>
        <CWText type="caption" className="status">
          Status: {connectionStatus}
        </CWText>
      </div>
      <CWText type="b1" className="card-description">
        {description}
      </CWText>
      <CWButton
        buttonType="primary"
        label={
          connectedServer ? `${serverName} Connected` : `Connect ${serverName}`
        }
        disabled={isConnecting || !!existingServer}
        onClick={handleConnect}
      />
      {isConnecting && <CWText type="caption">Redirecting to auth...</CWText>}
    </CWCard>
  );
};

export default MCPServerConnectionCard;
