import { ChainBase, DefaultPage } from '@hicommonwealth/core';
import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { uuidv4 } from 'lib/util';
import 'pages/manage_community/community_metadata_rows.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import useFetchDiscordChannelsQuery from 'state/api/fetchDiscordChannels';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { InputRow, SelectRow, ToggleRow } from 'views/components/metadata_rows';
import { useFlag } from '../../../hooks/useFlag';
import type CommunityInfo from '../../../models/ChainInfo';
import type RoleInfo from '../../../models/RoleInfo';
import { AvatarUpload } from '../../components/Avatar';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWText } from '../../components/component_kit/cw_text';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import CWLoadingSpinner from '../../components/component_kit/new_designs/CWLoadingSpinner';
import DirectoryPageSection from './DirectoryPageSection';
import { DiscordForumConnections } from './DiscordForumConnections';
import { getCommunityTags, setCommunityCategories } from './helpers';
import { ManageRoles } from './manage_roles';

type CommunityMetadataRowsProps = {
  admins: Array<RoleInfo>;
  community?: CommunityInfo;
  mods: any;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  onSave: () => void;
};

export const CommunityMetadataRows = ({
  community,
  admins,
  mods,
  onRoleUpdate,
  onSave,
}: CommunityMetadataRowsProps) => {
  const communityHomepageEnabled = useFlag('communityHomepage');

  const params = new URLSearchParams(window.location.search);
  const returningFromDiscordCallback = params.get(
    'returningFromDiscordCallback',
  );

  const { data: topics, refetch: refetchTopics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const { data: discordChannels } = useFetchDiscordChannelsQuery({
    chainId: app.activeChainId(),
  });

  const {
    discords: initialDiscords,
    elements: initialElements,
    telegrams: initialTelegrams,
    githubs: initialGithubs,
    remainingLinks,
  } = community.categorizeSocialLinks();

  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [website, setWebsite] = useState(remainingLinks[0]);
  const [discord, setDiscord] = useState(initialDiscords[0]);
  const [element, setElement] = useState(initialElements[0]);
  const [telegram, setTelegram] = useState(initialTelegrams[0]);
  const [github, setGithub] = useState(initialGithubs[0]);
  const [stagesEnabled, setStagesEnabled] = useState(community.stagesEnabled);
  const [customStages, setCustomStages] = useState(community.customStages);
  const [customDomain, setCustomDomain] = useState(community.customDomain);
  const [terms, setTerms] = useState(community.terms);
  const [directoryPageEnabled, setDirectoryPageEnabled] = useState(
    community.directoryPageEnabled,
  );
  const [selectedChainNodeId, setSelectedChainNodeId] = useState(
    community.directoryPageChainNodeId,
  );
  const [iconUrl, setIconUrl] = useState(community.iconUrl);
  const [snapshot, setSnapshot] = useState(community.snapshot);
  const [snapshotString, setSnapshotString] = useState(
    community.snapshot.toString(),
  );
  const [defaultOverview, setDefaultOverview] = useState(
    community.defaultOverview,
  );
  const [defaultPage, setDefaultPage] = useState(community.defaultPage);
  const [hasHomepage, setHasHomepage] = useState(community.hasHomepage);
  const [selectedTags2, setSelectedTags2] = useState(
    getCommunityTags(community.id),
  );
  const [discordBotConnected, setDiscordBotConnected] = useState(
    returningFromDiscordCallback === 'true'
      ? true
      : community.discordConfigId !== null,
  );
  const [discordBotConnecting, setDiscordBotConnecting] = useState(
    returningFromDiscordCallback === 'true'
      ? true
      : community.discordConfigId !== null,
  );
  const [communityBanner, setCommunityBanner] = useState(
    community.communityBanner,
  );
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [discordWebhooksEnabled, setDiscordWebhooksEnabled] = useState(
    community.discordBotWebhooksEnabled,
  );

  useEffect(() => {
    setDiscordBotConnected(community.discordConfigId !== null);
  }, [community]);

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

    // Update communityCategories
    try {
      await setCommunityCategories(selectedTags2, community.id);
    } catch (err) {
      console.log(err);
    }

    try {
      axios
        .post(`${app.serverUrl()}/updateBanner`, {
          chain_id: community.id,
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
    const social_links: string[] = [
      website,
      discord,
      element,
      telegram,
      github,
    ];
    try {
      await community.updateChainData({
        name,
        description,
        social_links,
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
        directory_page_enabled: directoryPageEnabled,
        directory_page_chain_node_id: selectedChainNodeId,
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
          }`,
        )}/discord-callback&response_type=code&scope=bot&state=${encodeURI(
          JSON.stringify({
            cw_chain_id: app.activeChainId(),
            verification_token,
            redirect_domain: isCustomDomain
              ? window.location.origin
              : undefined,
          }),
        )}`,
        '_parent',
      );

      setDiscordBotConnected(false);
      setDiscordBotConnecting(true);
    } catch (e) {
      console.log(e);
    }
  };

  const updateDiscordWebhookEnabled = async () => {
    try {
      await community.updateChainData({
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
          }`,
        )}/discord-callback&response_type=code&scope=bot&state=${encodeURI(
          JSON.stringify({
            cw_chain_id: app.activeChainId(),
            verification_token,
            redirect_domain: isCustomDomain
              ? window.location.origin
              : undefined,
          }),
        )}`,
        '_parent',
      );
      setDiscordBotConnecting(true);
    } catch (e) {
      console.log(e);
    }
  };

  const handleToggleEnableDirectoryPage = (enabled: boolean) => {
    setDirectoryPageEnabled(enabled);

    // reset selectedChainNodeId to the default saved in the DB
    if (!enabled) {
      setSelectedChainNodeId(community.directoryPageChainNodeId);
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

      {communityHomepageEnabled && (
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
      {communityHomepageEnabled && hasHomepage ? (
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
        value={JSON.stringify(customStages)}
        placeholder='["Temperature Check", "Consensus Check"]'
        onChangeHandler={(v) => setCustomStages(v)}
      />

      <CWDivider className="directory-page-divider" />

      <DirectoryPageSection
        directoryPageEnabled={directoryPageEnabled}
        setDirectoryPageEnabled={handleToggleEnableDirectoryPage}
        isGoToDirectoryButtonEnabled={community.directoryPageEnabled}
        selectedChainNodeId={selectedChainNodeId}
        setSelectedChainNodeId={setSelectedChainNodeId}
      />
      <CWDivider className="directory-page-divider" />

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
                            channel.id,
                          );
                          await refetchTopics();
                          notifySuccess(
                            `#${channel.name} connected to ${
                              topics.find(
                                (topic) => topic.id === Number(topicId),
                              )?.name
                            }!`,
                          );
                        } catch (e) {
                          console.log(e);
                          notifyError('Error connecting channel to topic.');
                        }
                      },
                    };
                  })}
                  topics={topics.map((topic) => ({
                    name: topic.name,
                    id: `${topic.id}`,
                    channelId: topic.channelId,
                  }))}
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
                <CWLoadingSpinner />
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
