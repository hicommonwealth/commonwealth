import axios from 'axios';
import { ChainBase, DefaultPage } from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { featureFlags } from 'helpers/feature-flags';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { uuidv4 } from 'lib/util';
import 'pages/manage_community/chain_metadata_rows.scss';
import React, { useCallback, useEffect, useState } from 'react';
import app from 'state';
import { InputRow, SelectRow, ToggleRow } from 'views/components/metadata_rows';
import type ChainInfo from '../../../models/ChainInfo';
import type RoleInfo from '../../../models/RoleInfo';
import { AvatarUpload } from '../../components/Avatar';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { setChainCategories, setSelectedTags } from './helpers';
import { ManageRoles } from './manage_roles';
import { useFetchTopicsQuery } from 'state/api/topics';
import useFetchDiscordChannelsQuery from 'state/api/fetchDiscordChannels';
import { CWClose } from '../../components/component_kit/cw_icons/cw_icons';
import { openConfirmation } from '../../modals/confirmation_modal';
import { CWToggle } from '../../components/component_kit/cw_toggle';

type ChainMetadataRowsProps = {
  admins: Array<RoleInfo>;
  chain?: ChainInfo;
  mods: any;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  onSave: () => void;
};

type DiscordChannelConnection = {
  channelName: string;
  channelId: string;
  onConnect: (topicId: string) => void;
};

const DiscordForumConnections = ({
  channels,
  topics,
  refetchTopics,
}: {
  channels: DiscordChannelConnection[];
  topics: { id: string; name: string; channelId: string | null }[];
  refetchTopics: () => Promise<void>;
}) => {
  const topicOptions = topics.map((topic) => {
    return { label: topic.name, value: topic.id };
  });

  const connectedTopics = topics.filter(
    (topic) => topic.channelId !== null && topic.channelId !== ''
  );

  const [connectionVerified, setConnectionVerified] = useState(true);
  const [topicIdToRemoveConnection, setTopicIdToRemoveConnection] = useState<
    string | null
  >(null);

  const removeConnection = (topicId: string) => {
    setTopicIdToRemoveConnection(topicId);

    openConfirmation({
      title: 'Warning',
      // eslint-disable-next-line max-len
      description: `Are you sure you want to remove this connection? New comments on Discord threads will NOT be updated on Commonwealth.`,
      buttons: [
        {
          label: 'Remove',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await app.discord.setForumChannelConnection(topicId, null);
              setConnectionVerified(false);
              await refetchTopics();
              setConnectionVerified(true);
            } catch (e) {
              console.log(e);
            }
          },
        },
        {
          label: 'No',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <div className="DiscordForumConnections">
      {channels.length > 0 ? (
        <div className="TopicRow">
          <CWText className="HeaderText">Channel</CWText>
          <CWText>Topic</CWText>
        </div>
      ) : (
        <CWText>Add a forum channel in your Discord server</CWText>
      )}

      {channels.map((channel) => {
        const connectedTopic = topics.find(
          (topic) => topic.channelId === channel.channelId
        );

        const remainingTopics = topicOptions.filter(
          (topic) =>
            !connectedTopics.find(
              (connected_topic) => connected_topic.id === topic.value
            )
        );

        if (connectedTopic) {
          remainingTopics.push({
            label: connectedTopic.name,
            value: connectedTopic.id,
          });
        }

        return (
          <div key={channel.channelId} className="TopicRow">
            <CWText className="ChannelText">#{channel.channelName}</CWText>
            {connectionVerified && (
              <CWDropdown
                initialValue={
                  connectedTopic
                    ? { label: connectedTopic.name, value: connectedTopic.id }
                    : { label: 'Not connected', value: '' }
                }
                options={remainingTopics}
                onSelect={async (item) => {
                  // Connect the channel to the topic
                  channel.onConnect(item.value);
                }}
              />
            )}
            {connectedTopic && (
              <CWClose
                className="CloseButton"
                onClick={() => {
                  removeConnection(connectedTopic.id);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const ChainMetadataRows = ({
  chain,
  admins,
  mods,
  onRoleUpdate,
  onSave,
}: ChainMetadataRowsProps) => {
  const params = new URLSearchParams(window.location.search);
  const returningFromDiscordCallback = params.get(
    'returningFromDiscordCallback'
  );

  const { data: topics, refetch: refetchTopics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const { data: discordChannels, refetch: refetchDiscordSettings } =
    useFetchDiscordChannelsQuery({
      chainId: app.activeChainId(),
    });

  const [name, setName] = useState(chain.name);
  const [description, setDescription] = useState(chain.description);
  const [website, setWebsite] = useState(chain.website);
  const [discord, setDiscord] = useState(chain.discord);
  const [element, setElement] = useState(chain.element);
  const [telegram, setTelegram] = useState(chain.telegram);
  const [github, setGithub] = useState(chain.github);
  const [stagesEnabled, setStagesEnabled] = useState(chain.stagesEnabled);
  const [customStages, setCustomStages] = useState(chain.customStages);
  const [customDomain, setCustomDomain] = useState(chain.customDomain);
  const [terms, setTerms] = useState(chain.terms);
  const [iconUrl, setIconUrl] = useState(chain.iconUrl);
  const [snapshot, setSnapshot] = useState(chain.snapshot);
  const [snapshotString, setSnapshotString] = useState(
    chain.snapshot.toString()
  );
  const [defaultOverview, setDefaultOverview] = useState(chain.defaultOverview);
  const [defaultPage, setDefaultPage] = useState(chain.defaultPage);
  const [hasHomepage, setHasHomepage] = useState(chain.hasHomepage);
  const [selectedTags2, setSelectedTags2] = useState(setSelectedTags(chain.id));
  const [discordBotConnected, setDiscordBotConnected] = useState(
    returningFromDiscordCallback === 'true'
      ? true
      : chain.discordConfigId !== null
  );
  const [discordBotConnecting, setDiscordBotConnecting] = useState(
    returningFromDiscordCallback === 'true'
      ? true
      : chain.discordConfigId !== null
  );
  const [communityBanner, setCommunityBanner] = useState(chain.communityBanner);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [snapshotNotificationsEnabled, setSnapshotNotificationsEnabled] =
    useState(false);
  const [selectedSnapshotChannel, setSelectedSnapshotChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedChannelLoaded, setSelectedChannelLoaded] = useState(false);
  const [discordWebhooksEnabled, setDiscordWebhooksEnabled] = useState(
    chain.discordBotWebhooksEnabled
  );

  useEffect(() => {
    setDiscordBotConnected(chain.discordConfigId !== null);
  }, [chain]);

  useEffect(() => {
    if (
      discordChannels &&
      discordChannels.selectedChannel &&
      discordChannels.selectedChannel.id
    ) {
      setSelectedSnapshotChannel(discordChannels.selectedChannel);
      setSnapshotNotificationsEnabled(true);
      setSelectedChannelLoaded(true);
    }
  }, [discordChannels]);

  if (!selectedTags2) {
    return;
  }

  const handleSaveChanges = async () => {
    for (const space of snapshot) {
      if (
        space.slice(space.length - 4) !== '.eth' &&
        space.slice(space.length - 4) !== '.xyz'
      ) {
        notifyError('Snapshot name must be in the form of *.eth or *.xyz');
        return;
      }
    }

    // Update ChainCategories
    try {
      await setChainCategories(selectedTags2, chain.id);
    } catch (err) {
      console.log(err);
    }

    try {
      axios
        .post(`${app.serverUrl()}/updateBanner`, {
          chain_id: chain.id,
          banner_text: communityBanner,
          auth: true,
          jwt: app.user.jwt,
        })
        .then(() => {
          app.chain.meta.setBanner(communityBanner);

          if (localStorage.getItem(`${app.activeChainId()}-banner`) === 'off') {
            localStorage.setItem(`${app.activeChainId()}-banner`, 'on');
          }
        });
    } catch (err) {
      console.log(err);
    }
    try {
      await chain.updateChainData({
        name,
        description,
        website,
        discord,
        element,
        telegram,
        github,
        stagesEnabled,
        customStages,
        customDomain,
        snapshot,
        terms,
        iconUrl,
        defaultOverview,
        defaultPage,
        hasHomepage,
        chain_node_id: null,
      });
      onSave();
      notifySuccess('Chain updated');
      app.sidebarRedraw.emit('redraw');
    } catch (err) {
      notifyError(err || 'Chain update failed');
    }
  };

  const handleReconnectBot = async () => {
    try {
      const verification_token = uuidv4();
      await app.discord.createConfig(verification_token);

      const isCustomDomain = app.isCustomDomain();

      window.open(
        `https://discord.com/oauth2/authorize?client_id=${
          process.env.DISCORD_CLIENT_ID
        }&permissions=1024&scope=applications.commands%20bot&redirect_uri=${encodeURI(
          `${
            !isCustomDomain ? window.location.origin : 'https://commonwealth.im'
          }`
        )}/discord-callback&response_type=code&scope=bot&state=${encodeURI(
          JSON.stringify({
            cw_chain_id: app.activeChainId(),
            verification_token,
            redirect_domain: isCustomDomain
              ? window.location.origin
              : undefined,
          })
        )}`,
        '_parent'
      );

      setDiscordBotConnected(false);
      setDiscordBotConnecting(true);
    } catch (e) {
      console.log(e);
    }
  };

  const handleSaveCommonbotSettings = async () => {
    if (snapshotNotificationsEnabled && !selectedSnapshotChannel?.name) {
      notifyError('Please select a channel');
      return;
    }

    try {
      const channelId = snapshotNotificationsEnabled
        ? selectedSnapshotChannel?.id
        : 'disabled';

      await app.discord.setConfig(channelId);
      notifySuccess('Snapshot Notifications Settings Saved');
    } catch (e) {
      console.log(e);
    }
  };

  const updateDiscordWebhookEnabled = async () => {
    try {
      await chain.updateChainData({
        discord_bot_webhooks_enabled: !discordWebhooksEnabled,
      });
      setDiscordWebhooksEnabled(!discordWebhooksEnabled);

      notifySuccess('Settings updated');
    } catch (e) {
      notifyError(e || 'Update failed');
    }
  };

  const handleConnectBot = async () => {
    try {
      const verification_token = uuidv4();

      await app.discord.createConfig(verification_token);

      const isCustomDomain = app.isCustomDomain();

      window.open(
        `https://discord.com/oauth2/authorize?client_id=${
          process.env.DISCORD_CLIENT_ID
        }&permissions=1024&scope=applications.commands%20bot&redirect_uri=${encodeURI(
          `${
            !isCustomDomain ? window.location.origin : 'https://commonwealth.im'
          }`
        )}/discord-callback&response_type=code&scope=bot&state=${encodeURI(
          JSON.stringify({
            cw_chain_id: app.activeChainId(),
            verification_token,
            redirect_domain: isCustomDomain
              ? window.location.origin
              : undefined,
          })
        )}`,
        '_parent'
      );
      setDiscordBotConnecting(true);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="ChainMetadataRows">
      <div className="AvatarUploadRow">
        <AvatarUpload
          scope="community"
          uploadStartedCallback={() => {
            setUploadInProgress(true);
          }}
          uploadCompleteCallback={(files) => {
            files.forEach((f) => {
              if (!f.uploadURL) {
                return;
              }
              setIconUrl(f.uploadURL.replace(/\?.*/, ''));
            });
            setUploadInProgress(false);
          }}
        />
      </div>
      <InputRow title="Name" value={name} onChangeHandler={(v) => setName(v)} />
      <InputRow
        title="Description"
        value={description}
        onChangeHandler={(v) => setDescription(v)}
        textarea
      />
      <InputRow
        title="Website"
        value={website}
        placeholder="https://example.com"
        onChangeHandler={(v) => setWebsite(v)}
      />
      <InputRow
        title="Discord"
        value={discord}
        placeholder="https://discord.com/invite"
        onChangeHandler={(v) => setDiscord(v)}
      />
      <InputRow
        title="Element"
        value={element}
        placeholder="https://matrix.to/#"
        onChangeHandler={(v) => setElement(v)}
      />
      <InputRow
        title="Telegram"
        value={telegram}
        placeholder="https://t.me"
        onChangeHandler={(v) => setTelegram(v)}
      />
      <InputRow
        title="Github"
        value={github}
        placeholder="https://github.com"
        onChangeHandler={(v) => setGithub(v)}
      />
      <ToggleRow
        title="Stages"
        defaultValue={stagesEnabled}
        onToggle={() => setStagesEnabled((prevState) => !prevState)}
        caption={() =>
          stagesEnabled
            ? 'Show proposal progress on threads'
            : "Don't show progress on threads"
        }
      />

      {featureFlags.communityHomepage && (
        <ToggleRow
          title="Homepage"
          defaultValue={hasHomepage}
          onToggle={() => {
            setHasHomepage((prevHasHomepage) => {
              if (!prevHasHomepage) {
                setDefaultPage(DefaultPage.Homepage);
              }
              return !prevHasHomepage;
            });
          }}
          caption={(checked) =>
            checked
              ? 'Enable homepage feature for this community'
              : 'Disable homepage feature for this community'
          }
        />
      )}
      {featureFlags.communityHomepage && hasHomepage ? (
        <SelectRow
          title="Default Page"
          options={[
            {
              label: 'Discussions',
              value: DefaultPage.Discussions,
            },
            {
              label: 'Overview',
              value: DefaultPage.Overview,
            },
            {
              label: 'Homepage',
              value: DefaultPage.Homepage,
            },
          ]}
          selected={defaultPage}
          onChange={(e) => {
            setDefaultPage(e);
            if (e === DefaultPage.Overview) {
              setDefaultOverview(e === DefaultPage.Overview);
            }
          }}
        />
      ) : (
        <SelectRow
          title="Default Page"
          options={[
            {
              label: 'Discussions',
              value: DefaultPage.Discussions,
            },
            {
              label: 'Overview',
              value: DefaultPage.Overview,
            },
          ]}
          selected={
            defaultOverview ? DefaultPage.Overview : DefaultPage.Discussions
          }
          onChange={(e) => setDefaultOverview(e === DefaultPage.Overview)}
        />
      )}
      <InputRow
        title="Custom Stages"
        value={customStages}
        placeholder='["Temperature Check", "Consensus Check"]'
        onChangeHandler={(v) => setCustomStages(v)}
      />
      <InputRow
        title="Domain"
        value={customDomain}
        placeholder="Contact support" // gov.edgewa.re
        onChangeHandler={(v) => setCustomDomain(v)}
        disabled // Custom domains should be admin configurable only
      />
      {app.chain?.meta.base === ChainBase.Ethereum && (
        <InputRow
          title="Snapshot(s) -- use commas to add multiple spaces"
          value={snapshotString}
          placeholder="space-name.eth, space-2-name.xyz"
          onChangeHandler={(v) => {
            const snapshots = v
              .split(',')
              .map((val) => {
                if (val.lastIndexOf('/') > -1) {
                  return val.slice(val.lastIndexOf('/') + 1).trim();
                } else {
                  return val.trim();
                }
              })
              .filter((val) => val.length > 4);
            const uniqueSnpshots = [...new Set(snapshots)] as string[];
            setSnapshot(uniqueSnpshots);
            setSnapshotString(v);
          }}
        />
      )}
      <InputRow
        title="Terms of Service"
        value={terms}
        placeholder="Url that new users see"
        onChangeHandler={(v) => setTerms(v)}
      />
      <InputRow
        title="Banner"
        maxLength={512}
        placeholder="Text for across the top of your community"
        value={communityBanner}
        onChangeHandler={(v) => setCommunityBanner(v)}
      />
      <div className="tag-row">
        <CWLabel label="Community Tags" />
        <div className="tag-group">
          {selectedTags2 &&
            Object.keys(selectedTags2).map((key) => {
              return (
                <CWButton
                  key={key}
                  label={key}
                  buttonType={
                    selectedTags2[key] ? 'primary-black' : 'secondary-black'
                  }
                  onClick={() => {
                    setSelectedTags2({
                      ...selectedTags2,
                      [key]: !selectedTags2[key],
                    });
                  }}
                />
              );
            })}
        </div>
      </div>

      <ManageRoles
        label="Admins"
        roledata={admins}
        onRoleUpdate={(x, y) => onRoleUpdate(x, y)}
      />
      {mods.length > 0 && (
        <ManageRoles
          label="Moderators"
          roledata={mods}
          onRoleUpdate={(x, y) => onRoleUpdate(x, y)}
        />
      )}
      <CWButton
        disabled={uploadInProgress}
        label="Save changes"
        onClick={handleSaveChanges}
      />
      <div className="commonbot-section">
        <CWText type="h3">Commonbot Settings</CWText>
        {discordBotConnected ? (
          <>
            <div className="connected-line">
              <CWText type="h4">Connection Status</CWText>
              <div className="connect-group">
                <CWIcon iconName="check" iconSize="small" />
                <CWText>Connected</CWText>
              </div>
            </div>
            <CWButton
              label="reconnect"
              buttonType="mini-black"
              className="connect-button"
              onClick={handleReconnectBot}
            />
            {/* <div className="snapshot-settings">
              <CWText type="h4">Snapshot Notifications</CWText>
              <CWToggle
                onChange={() =>
                  setSnapshotNotificationsEnabled((prevState) => !prevState)
                }
                checked={snapshotNotificationsEnabled}
              />
            </div>
            <div className="connected-line">
              {discordChannels && snapshotNotificationsEnabled && (
                <CWDropdown
                  label={'Select Channel'}
                  options={discordChannels.textChannels.map((channel) => {
                    return {
                      label: channel.name,
                      value: channel.id,
                    };
                  })}
                  initialValue={{
                    value: selectedSnapshotChannel?.id ?? 'channel',
                    label: selectedSnapshotChannel?.name ?? 'Select a Channel',
                  }}
                  onSelect={(item) => {
                    setSelectedSnapshotChannel({
                      id: item.value,
                      name: item.label,
                    });
                  }}
                />
              )}
            </div> */}
            <div className="snapshot-settings">
              <CWText type="h4">Connected Forum Channels</CWText>
            </div>
            <CWText type="caption" className="ForumCaption">
              Adding a connection will sync discord content to your Common
              forum.
            </CWText>
            <div className="connected-line">
              {discordChannels && (
                <DiscordForumConnections
                  channels={discordChannels.forumChannels?.map((channel) => {
                    return {
                      channelName: channel.name,
                      channelId: channel.id,
                      connectedTopicId: '',
                      onConnect: async (topicId: string) => {
                        try {
                          await app.discord.setForumChannelConnection(
                            topicId,
                            channel.id
                          );
                          await refetchTopics();
                          notifySuccess(
                            `#${channel.name} connected to ${
                              topics.find((topic) => topic.id === topicId)?.name
                            }!`
                          );
                        } catch (e) {
                          console.log(e);
                          notifyError('Error connecting channel to topic.');
                        }
                      },
                    };
                  })}
                  topics={topics}
                  refetchTopics={async () => {
                    await refetchTopics();
                  }}
                />
              )}
            </div>

            <div className="toggle-section">
              <CWToggle
                checked={discordWebhooksEnabled}
                onChange={() => {
                  updateDiscordWebhookEnabled();
                }}
              />
              <CWText type="b2" fontWeight="regular">
                Allow webhook notifications for Bridged Forum posts.
              </CWText>
            </div>
          </>
        ) : discordBotConnecting ? (
          <>
            <div className="settings-row">
              <div className="spinner-group">
                <CWSpinner />
                <CWText>Connecting...</CWText>
              </div>
              <CWText>Refresh to check if connection succeeded</CWText>
            </div>
          </>
        ) : (
          <div className="settings-row">
            <CWButton
              label="Connect"
              buttonType="primary-black"
              onClick={handleConnectBot}
            />
          </div>
        )}
      </div>
    </div>
  );
};
