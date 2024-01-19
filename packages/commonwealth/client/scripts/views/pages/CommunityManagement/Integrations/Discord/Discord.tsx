import { useFetchTopicsQuery } from 'client/scripts/state/api/topics';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { uuidv4 } from 'lib/util';
import React, { useCallback, useEffect, useState } from 'react';
import app from 'state';
import useFetchDiscordChannelsQuery from 'state/api/fetchDiscordChannels';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { DiscordForumConnections } from '../../../manage_community/DiscordForumConnections';
import './Discord.scss';
import { ConnectionStatus } from './types';

const CTA_TEXT = {
  connected: 'Reconnect Discord',
  none: 'Connect Discord',
  connecting: 'Connecting Discord...',
};

const Discord = () => {
  const [community] = useState(app.config.chains.getById(app.activeChainId()));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    community.discordConfigId ? 'connected' : 'none',
  );
  const [isDiscordWebhooksEnabled, setIsDiscordWebhooksEnabled] = useState(
    community.discordBotWebhooksEnabled,
  );
  const { data: discordChannels } = useFetchDiscordChannelsQuery({
    chainId: app.activeChainId(),
  });
  const { data: topics = [], refetch: refetchTopics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  useEffect(() => {
    if (community.discordConfigId) {
      setConnectionStatus('connected');
    }
  }, [community]);

  const onConnect = useCallback(async () => {
    if (connectionStatus === 'connecting') return;
    setConnectionStatus('connecting');

    try {
      const verificationToken = uuidv4();
      await app.discord.createConfig(verificationToken);
      const isCustomDomain = app.isCustomDomain();

      const redirectURL = encodeURI(
        !isCustomDomain ? window.location.origin : 'https://commonwealth.im',
      );
      const currentState = encodeURI(
        JSON.stringify({
          cw_chain_id: app.activeChainId(),
          verification_token: verificationToken,
          redirect_domain: isCustomDomain ? window.location.origin : undefined,
        }),
      );
      const link = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=1024&scope=applications.commands%20bot&redirect_uri=${redirectURL}/discord-callback&response_type=code&scope=bot&state=${currentState}`;
      window.open(link, '_parent');

      setConnectionStatus('none');
    } catch (e) {
      notifyError('Failed to connect discord!');
      setConnectionStatus('none');
    }
  }, [connectionStatus]);

  const onToggleWebhooks = useCallback(async () => {
    const toggleMsgType = isDiscordWebhooksEnabled ? 'disable' : 'enable';

    try {
      await community.updateChainData({
        discord_bot_webhooks_enabled: !isDiscordWebhooksEnabled,
      });
      setIsDiscordWebhooksEnabled(!isDiscordWebhooksEnabled);

      notifySuccess(`Discord webhooks ${toggleMsgType}d!`);
    } catch (e) {
      notifyError(e || `Failed to ${toggleMsgType} discord webhooks!`);
    }
  }, [isDiscordWebhooksEnabled, community]);

  const onConnectDiscordChannel = async (
    channelId: string,
    channelName: string,
    topicId: string,
  ) => {
    try {
      await app.discord.setForumChannelConnection(topicId, channelId);
      await refetchTopics();
      const topicName = topics.find(
        (topic) => topic.id === Number(topicId),
      )?.name;
      notifySuccess(
        `#${channelName} connected${topicName ? ` to ${topicName}` : ''}!`,
      );
    } catch {
      notifyError('Failed to connect channel to topic!');
    }
  };

  return (
    <section className="Discord">
      <div className="header">
        <CWText type="h4">Discord</CWText>
        <CWText type="b1">
          <p>
            You can merge content from Discord directly into your community by
            connecting the Commonbot.{' '}
            <a href="https://docs.commonwealth.im/commonwealth/bridged-discord-forum-bot">
              Learn more
            </a>
          </p>
        </CWText>
      </div>

      {connectionStatus === 'connected' && (
        <>
          <section className="connected">
            <div className="header">
              <CWText type="h5">Connected Forum Channels</CWText>
              <CWText type="b1" className="ForumCaption">
                Adding a connection will sync discord content to your Common
                forum.
              </CWText>
            </div>

            {discordChannels && (
              <div className="channels">
                <DiscordForumConnections
                  channels={(discordChannels.forumChannels || [])?.map(
                    (channel) => {
                      return {
                        channelName: channel.name,
                        channelId: channel.id,
                        connectedTopicId: '',
                        onConnect: async (topicId: string) => {
                          await onConnectDiscordChannel(
                            channel.id,
                            channel.name,
                            topicId,
                          );
                        },
                      };
                    },
                  )}
                  topics={topics.map((topic) => ({
                    name: topic.name,
                    id: `${topic.id}`,
                    channelId: topic.channelId,
                  }))}
                  refetchTopics={async () => {
                    await refetchTopics();
                  }}
                />
              </div>
            )}

            <div className="webhooks">
              <CWText type="b2" fontWeight="regular">
                Allow webhook notifications for Bridged Forum posts.
              </CWText>
              <CWToggle
                size="small"
                checked={isDiscordWebhooksEnabled}
                onChange={onToggleWebhooks}
              />
            </div>
          </section>
        </>
      )}

      <CWButton
        buttonType="secondary"
        label={CTA_TEXT[connectionStatus]}
        disabled={connectionStatus === 'connecting'}
        onClick={onConnect}
      />
    </section>
  );
};

export default Discord;
