import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useSetDiscordBotConfigMutation } from 'state/api/discord';
import { PageNotFound } from '../../../404';
import { PageLoading } from '../../../loading';

const CallbackPage = () => {
  const navigate = useCommonNavigate();
  const [failed, setFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string>('');
  const redirectPath = 'manage/integrations';

  const { mutateAsync: setDiscordBotConfig } = useSetDiscordBotConfigMutation();

  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');
  const guildId = params.get('guild_id');

  useEffect(() => {
    if (state && guildId) {
      const stateJSON = JSON.parse(decodeURI(state));
      setDiscordBotConfig({
        communityId: stateJSON.cw_chain_id,
        guildId,
        verificationToken: stateJSON.verification_token,
      })
        .then((res) => {
          const idParam = res.discordConfigId
            ? `?discordConfigId=${res.discordConfigId}`
            : '';

          if (stateJSON.redirect_domain) {
            window.location.href =
              `${stateJSON.redirect_domain}/${redirectPath}` + `${idParam}`;
          } else {
            navigate(
              `/${stateJSON.cw_chain_id}/${redirectPath}${idParam}`,
              {},
              null,
            );
          }
        })
        .catch((e) => {
          setFailed(true);

          if (e.response && e.response.data && e.response.data.error) {
            setFailureMessage(e.response.data.error);
          } else setFailureMessage(e.message);
        });
    }
  }, [state, guildId, setDiscordBotConfig]);

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
