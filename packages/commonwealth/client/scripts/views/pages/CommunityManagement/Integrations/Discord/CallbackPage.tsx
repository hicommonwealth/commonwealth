import axios from 'axios';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useState } from 'react';
import app from 'state';
import { PageNotFound } from '../../../404';
import { PageLoading } from '../../../loading';

const CallbackPage = () => {
  const navigate = useCommonNavigate();
  const [failed, setFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string>('');
  const redirectPath = 'manage/integrations';

  const setBotConfig = useCallback(
    async (state: string, guildId: string) => {
      const stateJSON = JSON.parse(decodeURI(state));

      try {
        const res = await axios.post(
          `${app.serverUrl()}/setDiscordBotConfig`,
          {
            community_id: stateJSON.cw_chain_id,
            guild_id: guildId,
            verification_token: stateJSON.verification_token,
            jwt: app.user.jwt,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const idParam = res?.data?.result?.discordConfigId
          ? `&discordConfigId=${res?.data?.result?.discordConfigId}`
          : '';

        if (stateJSON.redirect_domain) {
          window.location.href =
            `${stateJSON.redirect_domain}/${redirectPath}` +
            `?returningFromDiscordCallback=true${idParam}`;
        } else {
          navigate(
            `/${stateJSON.cw_chain_id}/${redirectPath}?returningFromDiscordCallback=true${idParam}`,
            {},
            null,
          );
        }
      } catch (e) {
        console.error(e);
        throw new Error(e.response.data.error);
      }
    },
    [navigate],
  );

  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');
  const guildId = params.get('guild_id');

  useEffect(() => {
    if (state && guildId) {
      setBotConfig(state, guildId).catch((e) => {
        setFailed(true);
        setFailureMessage(e.message);
      });
    }
  }, [state, guildId, state, setBotConfig]);

  if (!state || !guildId) {
    return <PageNotFound message="No callback data provided." />;
  }

  // Payable functions are not supported in this implementation
  return failed ? (
    <PageNotFound message={'Error connecting Discord: ' + failureMessage} />
  ) : (
    <PageLoading message="Connecting Discord" />
  );
};

export default CallbackPage;
