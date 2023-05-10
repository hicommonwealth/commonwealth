import React, { useCallback, useEffect, useState } from 'react';
import { uuidv4 } from 'lib/util';
import axios from 'axios';

import 'pages/manage_community/chain_metadata_rows.scss';

import app from 'state';
import { ChainBase, DefaultPage } from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { InputRow, SelectRow, ToggleRow } from 'views/components/metadata_rows';
import type ChainInfo from '../../../models/ChainInfo';
import type RoleInfo from '../../../models/RoleInfo';
import { AvatarUpload } from '../../components/avatar_upload';

import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import {
  buildCategoryMap,
  setChainCategories,
  setSelectedTags,
} from './helpers';
import { ManageRoles } from './manage_roles';
import { featureFlags } from 'helpers/feature-flags';

type ChainMetadataRowsProps = {
  admins: Array<RoleInfo>;
  chain?: ChainInfo;
  mods: any;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  onSave: () => void;
};

export const ChainMetadataRows = ({
  chain,
  admins,
  mods,
  onRoleUpdate,
  onSave,
}: ChainMetadataRowsProps) => {
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
    chain.discordConfigId !== null
  );
  const [discordBotConnecting, setDiscordBotConnecting] = useState(
    chain.discordConfigId !== null
  );
  const [communityBanner, setCommunityBanner] = useState(chain.communityBanner);
  const [channelsLoaded, setChannelsLoaded] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [snapshotChannels, setSnapshotChannels] = useState([]);
  const [snapshotNotificationsEnabled, setSnapshotNotificationsEnabled] =
    useState(false);
  const [selectedSnapshotChannel, setSelectedSnapshotChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const categoryMap = buildCategoryMap();

  const getChannels = useCallback(async () => {
    try {
      const res = await app.discord.getChannels(chain.id);
      setSnapshotChannels(res.channels);
      setSelectedSnapshotChannel(res.selectedChannel);

      if (res.selectedChannel?.id) {
        setSnapshotNotificationsEnabled(true);
      }

      setChannelsLoaded(true);
    } catch (e) {
      console.log(e);
    }
  }, [chain.id]);

  useEffect(() => {
    if (discordBotConnected && !channelsLoaded) {
      getChannels();
    }
  }, [channelsLoaded, discordBotConnected, getChannels]);

  if (!selectedTags2) {
    return;
  }

  const handleSaveChanges = async () => {
    for (const space of snapshot) {
      if (space !== '') {
        if (space.slice(space.length - 4) !== '.eth') {
          notifyError('Snapshot name must be in the form of *.eth');
          return;
        }
      }
    }

    // Update ChainCategories
    try {
      for (const category of Object.keys(selectedTags2)) {
        await setChainCategories(
          categoryMap[category],
          chain.id,
          selectedTags2[category]
        );
      }
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
        default_allow_permissions: chain.defaultAllowPermissions,
        default_deny_permissions: chain.defaultDenyPermissions,
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

      window.open(
        `https://discord.com/oauth2/authorize?client_id=${
          process.env.DISCORD_CLIENT_ID
        }&permissions=8&scope=applications.commands%20bot&redirect_uri=${encodeURI(
          process.env.DISCORD_UI_URL
        )}/callback&response_type=code&scope=bot&state=${encodeURI(
          JSON.stringify({
            cw_chain_id: app.activeChainId(),
            verification_token,
          })
        )}`
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

  const handleConnectBot = async () => {
    try {
      const verification_token = uuidv4();

      await app.discord.createConfig(verification_token);

      window.open(
        `https://discord.com/oauth2/authorize?client_id=${
          process.env.DISCORD_CLIENT_ID
        }&permissions=8&scope=applications.commands%20bot&redirect_uri=${encodeURI(
          process.env.DISCORD_UI_URL
        )}/callback&response_type=code&scope=bot&state=${encodeURI(
          JSON.stringify({
            cw_chain_id: app.activeChainId(),
            verification_token,
          })
        )}`
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
          title="Snapshot(s)"
          value={snapshotString}
          placeholder={chain.network}
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
            setSnapshot(snapshots);
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
              <CWText type="h4">Snapshot Notifications</CWText>
              <CWToggle
                onChange={() =>
                  setSnapshotNotificationsEnabled((prevState) => !prevState)
                }
                checked={snapshotNotificationsEnabled}
              />
            </div>
            <div className="connected-line">
              {channelsLoaded && (
                <CWDropdown
                  label={'Select Channel'}
                  options={snapshotChannels.map((channel) => {
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
            </div>

            <CWButton
              label="Save Commonbot Settings"
              className="save-snapshot"
              buttonType="primary-black"
              onClick={handleSaveCommonbotSettings}
            />
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
