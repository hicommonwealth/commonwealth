import { useQueryClient } from '@tanstack/react-query';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { trpc, trpcQueryUtils } from 'utils/trpcClient';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { openConfirmation } from 'views/modals/confirmation_modal';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

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

  const deletePrivateMcpServerMutation =
    trpc.community.deletePrivateMcpServer.useMutation({
      onSuccess: () => {
        setIsDeleting(false);
        notifySuccess(`${serverName} disconnected successfully`);
        // Invalidate the query to refresh the server list
        void queryClient.invalidateQueries({
          queryKey: [['mcp', 'getCommunityMcpServers']],
        });
      },
      onError: (error) => {
        setIsDeleting(false);
        notifyError(`Failed to disconnect ${serverName}: ${error.message}`);
      },
    });

  const existingServer = privateMcpServers.find(
    (server) => server.name === serverType,
  );

  const connectedServer = privateMcpServers.find(
    (server) => server.name === serverType && server.auth_completed,
  );

  const requiresAuth = existingServer && !connectedServer;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // If server exists but isn't connected, fetch OAuth URL from existing server
      // Otherwise create a new instance
      if (requiresAuth) {
        const result = await trpcQueryUtils.mcp.getKlavisMCPOAuthURL.fetch({
          server_name: serverType,
          community_id: communityId,
          original_url: window.location.href,
        });
        setIsConnecting(false);
        notifySuccess(`Redirecting to ${serverName} OAuth...`);
        window.location.href = result.oauthUrl;
      } else {
        await createKlavisMCPInstanceMutation.mutateAsync({
          community_id: communityId,
          serverType,
          original_url: window.location.href,
        });
      }
    } catch (error) {
      setIsConnecting(false);
      console.error('Connection error:', error);
      notifyError(
        `Failed to connect ${serverName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  const confirmAndDelete = async () => {
    if (!connectedServer?.id) return;

    setIsDeleting(true);
    try {
      await deletePrivateMcpServerMutation.mutateAsync({
        community_id: communityId,
        mcp_server_id: connectedServer.id,
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDelete = () => {
    if (!connectedServer) return;

    openConfirmation({
      title: 'Disconnect MCP Server',
      description: (
        <>
          Are you sure you want to disconnect <b>{serverName}</b>? This will
          remove all associated data and cannot be undone.
        </>
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
        {
          label: 'Disconnect',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: confirmAndDelete,
        },
      ],
    });
  };

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
      <div className="button-container">
        <CWButton
          buttonType="primary"
          label={
            connectedServer
              ? `${serverName} Connected`
              : existingServer
                ? 'Proceed With Authentication'
                : `Connect ${serverName}`
          }
          disabled={isConnecting || !!connectedServer}
          onClick={handleConnect}
        />
        {connectedServer && (
          <CWButton
            buttonType="destructive"
            label="Delete"
            disabled={isDeleting}
            onClick={handleDelete}
          />
        )}
      </div>
      {isConnecting && <CWText type="caption">Redirecting to auth...</CWText>}
    </CWCard>
  );
};

export default MCPServerConnectionCard;
