import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { trpc } from 'utils/trpcClient';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './GoogleSheetsMCP.scss';

const GoogleSheetsMCP = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const createKlavisMCPInstanceMutation =
    trpc.mcp.createKlavisMCPInstance.useMutation({
      onSuccess: (data) => {
        setIsConnecting(false);
        notifySuccess('Redirecting to Google Sheets OAuth...');
        // Navigate to the OAuth URL
        window.location.href = data.oauthUrl;
      },
      onError: (error) => {
        setIsConnecting(false);
        notifyError(`Failed to connect Google Sheets MCP: ${error.message}`);
      },
    });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await createKlavisMCPInstanceMutation.mutateAsync({
        serverType: 'Google Sheets' as const,
      });
    } catch (error) {
      // Error is handled by onError callback
      console.error('Connection error:', error);
    }
  };

  return (
    <section className="GoogleSheetsMCP">
      <div className="header">
        <CWText type="h4">Google Sheets MCP</CWText>
        <CWText type="b1">
          Connect Google Sheets to enable AI-powered spreadsheet interactions
          through the Model Context Protocol (MCP). This allows AI assistants to
          read and manipulate your Google Sheets data.
        </CWText>
      </div>

      <div className="connection-section">
        <CWText type="caption">Status: Not connected</CWText>

        <CWButton
          buttonType="primary"
          label="Connect Google Sheets MCP"
          disabled={isConnecting}
          onClick={handleConnect}
        />

        {isConnecting && (
          <CWText type="caption">Creating MCP instance...</CWText>
        )}
      </div>
    </section>
  );
};

export default GoogleSheetsMCP;
