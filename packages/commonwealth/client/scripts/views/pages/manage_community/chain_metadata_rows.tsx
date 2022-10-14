/* @jsx m */

import $ from 'jquery';
import m from 'mithril';

import 'pages/manage_community/chain_metadata_rows.scss';

import app from 'state';
import {
  ChainBase,
  ChainCategoryType,
  ChainNetwork,
} from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { InputRow, ToggleRow } from 'views/components/metadata_rows';
import { AvatarUpload } from 'views/components/avatar_upload';
import { ChainInfo } from 'models';
import { CWButton } from '../../components/component_kit/cw_button';
import { ManageRoles } from './manage_roles';
import {
  setSelectedTags,
  buildCategoryMap,
  setChainCategories,
} from './helpers';
import { CWLabel } from '../../components/component_kit/cw_label';

type ChainMetadataRowsAttrs = {
  admins: any;
  chain?: ChainInfo;
  mods: any;
  onRoleUpdate: (oldRole: string, newRole: string) => void;
  onSave: () => void;
};

export class ChainMetadataRows
  implements m.ClassComponent<ChainMetadataRowsAttrs>
{
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
  chatEnabled: boolean;
  customDomain: string;
  terms: string;
  defaultOverview: boolean;
  network: ChainNetwork;
  symbol: string;
  snapshot: string[];
  selectedTags: { [type in ChainCategoryType]?: boolean };
  categoryMap: { [type in ChainCategoryType]?: number };
  uploadInProgress: boolean;
  communityBanner: string;
  quillBanner: any;
  bannerStateUpdated: boolean;

  oninit(vnode) {
    this.name = vnode.attrs.chain.name;
    this.description = vnode.attrs.chain.description;
    this.website = vnode.attrs.chain.website;
    this.discord = vnode.attrs.chain.discord;
    this.element = vnode.attrs.chain.element;
    this.telegram = vnode.attrs.chain.telegram;
    this.github = vnode.attrs.chain.github;
    this.stagesEnabled = vnode.attrs.chain.stagesEnabled;
    this.customStages = vnode.attrs.chain.customStages;
    this.chatEnabled = vnode.attrs.chain.chatEnabled;
    this.customDomain = vnode.attrs.chain.customDomain;
    this.terms = vnode.attrs.chain.terms;
    this.iconUrl = vnode.attrs.chain.iconUrl;
    this.network = vnode.attrs.chain.network;
    this.symbol = vnode.attrs.chain.symbol;
    this.snapshot = vnode.attrs.chain.snapshot;
    this.defaultOverview = vnode.attrs.chain.defaultOverview;
    this.selectedTags = setSelectedTags(vnode.attrs.chain.id);
    this.categoryMap = buildCategoryMap();
    this.communityBanner = vnode.attrs.chain.communityBanner;
  }

  view(vnode) {
    return (
      <div class="ChainMetadataRows">
        <div class="AvatarUploadRow">
          <AvatarUpload
            scope="community"
            uploadStartedCallback={() => {
              this.uploadInProgress = true;
              m.redraw();
            }}
            uploadCompleteCallback={(files) => {
              files.forEach((f) => {
                if (!f.uploadURL) return;
                const url = f.uploadURL.replace(/\?.*/, '');
                this.iconUrl = url;
                $(vnode.dom).find('input[name=avatarUrl]').val(url.trim());
              });
              this.uploadInProgress = false;
              m.redraw();
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
          defaultValue={vnode.attrs.chain.stagesEnabled}
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
          title="Summary view"
          defaultValue={vnode.attrs.chain.defaultOverview}
          onToggle={(checked) => {
            this.defaultOverview = checked;
          }}
          caption={(checked) =>
            checked
              ? 'Discussion listing defaults to summary view'
              : 'Discussion listing defaults to latest activity view'
          }
        />
        <ToggleRow
          title="Chat Enabled"
          defaultValue={vnode.attrs.chain.chatEnabled}
          onToggle={(checked) => {
            this.chatEnabled = checked;
          }}
          caption={(checked) =>
            checked
              ? "Don't enable chat feature for this community"
              : 'Enable chat feature for this community '
          }
        />
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
            value={this.snapshot}
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
          name="Banner Text"
          label="Banner"
          maxlength={512}
          placeholder="Text for across the top of your community"
          value={this.communityBanner}
          onChangeHandler={(v) => {
            this.communityBanner = v;
          }}
          tabindex={1}
          editorNamespace="new-banner"
        />
        <div class="tag-row">
          <CWLabel label="Community Tags" />
          <div class="tag-group">
            {Object.keys(this.selectedTags).map((key) => {
              return (
                <CWButton
                  label={key}
                  buttonType={
                    this.selectedTags[key] ? 'primary-black' : 'secondary-black'
                  }
                  onclick={() => {
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
          onclick={async () => {
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
              chatEnabled,
              snapshot,
              terms,
              iconUrl,
              defaultOverview,
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
                  vnode.attrs.chain.id,
                  this.selectedTags[category]
                );
              }
            } catch (err) {
              console.log(err);
            }

            try {
              $.post(`${app.serverUrl()}/updateBanner`, {
                chain_id: vnode.attrs.chain.id,
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
              await vnode.attrs.chain.updateChainData({
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
                chatEnabled,
              });
              vnode.attrs.onSave();
              notifySuccess('Chain updated');
            } catch (err) {
              notifyError(err.responseJSON?.error || 'Chain update failed');
            }

            m.redraw();
          }}
        />
      </div>
    );
  }
}
