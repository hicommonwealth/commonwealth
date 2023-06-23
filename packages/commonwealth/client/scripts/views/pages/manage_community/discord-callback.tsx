import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from '../loading';
import React, { useCallback, useState } from 'react';
import { PageNotFound } from '../404';
import axios from 'axios';
import app from 'state';

const DiscordCallbackPage = () => {
  const navigate = useCommonNavigate();
  const [failed, setFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string>('');

  const setBotConfig = useCallback(
    async (state: string, guildId: string) => {
      const stateJSON = JSON.parse(decodeURI(state));

      try {
        await axios.post(
          `${app.serverUrl()}/setDiscordBotConfig`,
          {
            chain_id: stateJSON.cw_chain_id,
            guild_id: guildId,
            verification_token: stateJSON.verification_token,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        navigate(`/${stateJSON.cw_chain_id}/manage`, {}, null);
      } catch (e) {
        throw new Error(e.response.data.error);
      }
    },
    [navigate]
  );

  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');
  const guildId = params.get('guild_id');

  if (!state || !guildId) {
    return <PageNotFound message="No callback data provided." />;
  } else {
    setBotConfig(state, guildId).catch((e) => {
      setFailed(true);
      setFailureMessage(e.message);
    });
  }

  // Payable functions are not supported in this implementation
  return failed ? (
    <PageNotFound message={'Error connecting Discord: ' + failureMessage} />
  ) : (
    <PageLoading message="Connecting Discord" />
  );
};

export default DiscordCallbackPage;
