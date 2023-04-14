import type { ChainCategoryType, ChainNetwork } from 'common-common/src/types';
import { ChainBase, DefaultPage } from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import $ from 'jquery';
import { uuidv4 } from 'lib/util';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, redraw } from 'mithrilInterop';

import 'pages/manage_community/chain_metadata_rows.scss';
import { PermissionManager } from 'permissions';
import React from 'react';

import app from 'state';
import { AvatarUpload } from 'views/components/avatar_upload';
import { InputRow, SelectRow, ToggleRow } from 'views/components/metadata_rows';

import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import { buildCategoryMap, setChainCategories, setSelectedTags, } from './helpers';
import { ManageRoles } from './manage_roles';

type ChainMetadataRowsAttrs = {
  admins: Array<RoleInfo>;
  chain?: ChainInfo;
  mods: any;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  onSave: () => void;
};

export class ChainMetadataRows extends ClassComponent<ChainMetadataRowsAttrs> {
  name: string;
  description: string;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  url: string;
  loadingFinished: boolean;
  loadingStarted: boolean;
  iconUrl: string;
  stagesEnabled: boolean;
  customStages: string;
  default_allow_permissions: bigint;
  default_deny_permissions: bigint;
  customDomain: string;
  terms: string;
  defaultOverview: boolean;
  network: ChainNetwork;
  symbol: string;
  snapshot: string[];
  snapshotString: string;
  selectedTags: { [type in ChainCategoryType]?: boolean };
  categoryMap: { [type in ChainCategoryType]?: number };
  uploadInProgress: boolean;
  communityBanner: string;
  quillBanner: any;
  bannerStateUpdated: boolean;
  discordBotConnected: boolean;
  discordBotConnecting: boolean;
  channelsLoaded: boolean;
  snapshotChannels: { id: string; name: string }[];
  selectedSnapshotChannel: { id: string; name: string } | null;
  snapshotNotificationsEnabled: boolean;
  permissionsManager = new PermissionManager();
  defaultPage: string;
  hasHomepage: boolean;

  oninit(vnode: ResultNode<ChainMetadataRowsAttrs>) {
    const chain: ChainInfo = vnode.attrs.chain;
    this.name = chain.name;
    this.description = chain.description;
    this.website = chain.website;
    this.discord = chain.discord;
    this.element = chain.element;
    this.telegram = chain.telegram;
    this.github = chain.github;
    this.stagesEnabled = chain.stagesEnabled;
    this.customStages = chain.customStages;
    this.default_allow_permissions = chain.defaultAllowPermissions;
    this.default_deny_permissions = chain.defaultDenyPermissions;
    this.customDomain = chain.customDomain;
    this.terms = chain.terms;
    this.iconUrl = chain.iconUrl;
    this.network = chain.network;
    this.snapshot = chain.snapshot;
    this.snapshotString = chain.snapshot.toString();
    this.defaultOverview = chain.defaultOverview;
    this.defaultPage = chain.defaultPage;
    this.hasHomepage = chain.hasHomepage;
    this.selectedTags = setSelectedTags(chain.id);
    this.categoryMap = buildCategoryMap();
    this.discordBotConnected = chain.discordConfigId !== null;
    this.discordBotConnecting = this.discordBotConnected;
    this.communityBanner = chain.communityBanner;
    this.channelsLoaded = false;
    this.snapshotChannels = [];
    this.snapshotNotificationsEnabled = false;
  }

  view(vnode: ResultNode<ChainMetadataRowsAttrs>) {
    const chain: ChainInfo = vnode.attrs.chain;
    if (!this.selectedTags) return;

    const getChannels = async () => {
      try {
        const res = await app.discord.getChannels(chain.id);
        this.snapshotChannels = res.channels;
        this.selectedSnapshotChannel = res.selectedChannel;
        if (this.selectedSnapshotChannel.id) {
          this.snapshotNotificationsEnabled = true;
        }
        this.channelsLoaded = true;
        this.redraw();
      } catch (e) {
        console.log(e);
      }
    };
    if (this.discordBotConnected && !this.channelsLoaded) {
      getChannels();
    }

    return (
      <div className="ChainMetadataRows">
        <div className="AvatarUploadRow">
          <AvatarUpload
            scope="community"
            uploadStartedCallback={() => {
              this.uploadInProgress = true;
            }}
            uploadCompleteCallback={(files) => {
              files.forEach((f) => {
                if (!f.uploadURL) return;
                const url = f.uploadURL.replace(/\?.*/, '');
                this.iconUrl = url;
              });
              this.uploadInProgress = false;
            }}
          />
        </div>
        <InputRow
          title="Name"
          value={this.name}
          onChangeHandler={(v) => {
            this.name = v;
          }}
        />
        <InputRow
          title="Description"
          value={this.description}
          onChangeHandler={(v) => {
            this.description = v;
          }}
          textarea
        />
        <InputRow
          title="Website"
          value={this.website}
          placeholder="https://example.com"
          onChangeHandler={(v) => {
            this.website = v;
          }}
        />
        <InputRow
          title="Discord"
          value={this.discord}
          placeholder="https://discord.com/invite"
          onChangeHandler={(v) => {
            this.discord = v;
          }}
        />
        <InputRow
          title="Element"
          value={this.element}
          placeholder="https://matrix.to/#"
          onChangeHandler={(v) => {
            this.element = v;
          }}
        />
        <InputRow
          title="Telegram"
          value={this.telegram}
          placeholder="https://t.me"
          onChangeHandler={(v) => {
            this.telegram = v;
          }}
        />
        <InputRow
          title="Github"
          value={this.github}
          placeholder="https://github.com"
          onChangeHandler={(v) => {
            this.github = v;
          }}
        />
        <ToggleRow
          title="Stages"
          defaultValue={chain.stagesEnabled}
          onToggle={(checked) => {
            this.stagesEnabled = checked;
          }}
          caption={(checked) =>
            checked
              ? 'Show proposal progress on threads'
              : "Don't show progress on threads"
          }
        />
        <ToggleRow
          title="Homepage"
          defaultValue={chain.hasHomepage}
          onToggle={(checked) => {
            this.hasHomepage = checked;
            if (checked) this.defaultPage = DefaultPage.Homepage;
          }}
          caption={(checked) =>
            checked
              ? 'Enable homepage feature for this community'
              : 'Disable homepage feature for this community'
          }
        />
        {this.hasHomepage ? (
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
            selected={this.defaultPage}
            onChange={(e) => {
              this.defaultPage = e;
              if (e === DefaultPage.Discussions) this.defaultOverview = false;
              if (e === DefaultPage.Overview) this.defaultOverview = true;
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
              this.defaultOverview
                ? DefaultPage.Overview
                : DefaultPage.Discussions
            }
            onChange={(e) =>
              (this.defaultOverview = e === DefaultPage.Overview)
            }
          />
        )}
        <InputRow
          title="Custom Stages"
          value={this.customStages}
          placeholder='["Temperature Check", "Consensus Check"]'
          onChangeHandler={(v) => {
            this.customStages = v;
          }}
        />
        <InputRow
          title="Domain"
          value={this.customDomain}
          placeholder="Contact support" // gov.edgewa.re
          onChangeHandler={(v) => {
            this.customDomain = v;
          }}
          disabled // Custom domains should be admin configurable only
        />
        {app.chain?.meta.base === ChainBase.Ethereum && (
          <InputRow
            title="Snapshot(s)"
            value={this.snapshotString}
            placeholder={this.network}
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
              this.snapshot = snapshots;
              this.snapshotString = v;
            }}
          />
        )}
        <InputRow
          title="Terms of Service"
          value={this.terms}
          placeholder="Url that new users see"
          onChangeHandler={(v) => {
            this.terms = v;
          }}
        />
        <InputRow
          title="Banner"
          maxLength={512}
          placeholder="Text for across the top of your community"
          value={this.communityBanner}
          onChangeHandler={(v) => {
            this.communityBanner = v;
          }}
        />
        <div className="tag-row">
          <CWLabel label="Community Tags" />
          <div className="tag-group">
            {this.selectedTags &&
              Object.keys(this.selectedTags).map((key) => {
                return (
                  <CWButton
                    key={key}
                    label={key}
                    buttonType={
                      this.selectedTags[key]
                        ? 'primary-black'
                        : 'secondary-black'
                    }
                    onClick={() => {
                      this.selectedTags[key] = !this.selectedTags[key];
                    }}
                  />
                );
              })}
          </div>
        </div>

        <ManageRoles
          label="Admins"
          roledata={vnode.attrs.admins}
          onRoleUpdate={(x, y) => {
            vnode.attrs.onRoleUpdate(x, y);
          }}
        />
        {vnode.attrs.mods.length > 0 && (
          <ManageRoles
            label="Moderators"
            roledata={vnode.attrs.mods}
            onRoleUpdate={(x, y) => {
              vnode.attrs.onRoleUpdate(x, y);
            }}
          />
        )}
        <CWButton
          disabled={this.uploadInProgress}
          label="Save changes"
          onClick={async () => {
            const {
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
              default_deny_permissions,
              snapshot,
              terms,
              iconUrl,
              defaultOverview,
              defaultPage,
              hasHomepage,
            } = this;

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
              for (const category of Object.keys(this.selectedTags)) {
                await setChainCategories(
                  this.categoryMap[category],
                  chain.id,
                  this.selectedTags[category]
                );
              }
            } catch (err) {
              console.log(err);
            }

            try {
              $.post(`${app.serverUrl()}/updateBanner`, {
                chain_id: chain.id,
                banner_text: this.communityBanner,
                auth: true,
                jwt: app.user.jwt,
              }).then(() => {
                app.chain.meta.setBanner(this.communityBanner);

                if (
                  localStorage.getItem(`${app.activeChainId()}-banner`) ===
                  'off'
                ) {
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
                default_allow_permissions: this.default_allow_permissions,
                default_deny_permissions: this.default_deny_permissions,
              });
              vnode.attrs.onSave();
              notifySuccess('Chain updated');
            } catch (err) {
              notifyError(err || 'Chain update failed');
            }
            redraw();
          }}
        />
        <div className="commonbot-section">
          <CWText type="h3">Commonbot Settings</CWText>
          {this.discordBotConnected ? (
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
                onClick={async () => {
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
                    this.discordBotConnected = false;
                    this.discordBotConnecting = true;
                    this.redraw();
                  } catch (e) {
                    console.log(e);
                  }
                }}
              />
              <div className="snapshot-settings">
                <CWText type="h4">Snapshot Notifications</CWText>
                <CWToggle
                  onChange={() => {
                    this.snapshotNotificationsEnabled =
                      !this.snapshotNotificationsEnabled;
                    this.redraw();
                  }}
                  checked={this.snapshotNotificationsEnabled}
                />
              </div>
              <div className="connected-line">
                {this.channelsLoaded && (
                  <CWDropdown
                    label={'Select Channel'}
                    options={this.snapshotChannels.map((channel) => {
                      return {
                        label: channel.name,
                        value: channel.id,
                      };
                    })}
                    initialValue={{
                      value: this.selectedSnapshotChannel?.id ?? 'channel',
                      label:
                        this.selectedSnapshotChannel?.name ??
                        'Select a Channel',
                    }}
                    onSelect={(item) => {
                      this.selectedSnapshotChannel = {
                        id: item.value,
                        name: item.label,
                      };
                      this.redraw();
                    }}
                  />
                )}
              </div>

              <CWButton
                label="Save Commonbot Settings"
                className="save-snapshot"
                buttonType="primary-black"
                onClick={async () => {
                  if (
                    this.snapshotNotificationsEnabled &&
                    !this.selectedSnapshotChannel?.name
                  ) {
                    notifyError('Please select a channel');
                    return;
                  }
                  try {
                    const channelId = this.snapshotNotificationsEnabled
                      ? this.selectedSnapshotChannel?.id
                      : 'disabled';

                    await app.discord.setConfig(channelId);
                    notifySuccess('Snapshot Notifications Settings Saved');
                  } catch (e) {
                    console.log(e);
                  }
                }}
              />
            </>
          ) : this.discordBotConnecting ? (
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
                onClick={async () => {
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
                    this.discordBotConnecting = true;
                    this.redraw();
                  } catch (e) {
                    console.log(e);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}
