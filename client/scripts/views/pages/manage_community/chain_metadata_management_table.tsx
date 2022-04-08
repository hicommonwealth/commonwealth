/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import { Button, Table } from 'construct-ui';

import { ChainBase, ChainCategoryType, ChainNetwork } from 'types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { InputRow, ToggleRow } from 'views/components/metadata_rows';
import AvatarUpload, { AvatarScope } from 'views/components/avatar_upload';
import { ChainInfo } from 'client/scripts/models';
import { CWButton } from '../../components/component_kit/cw_button';
import { ManageRolesRow } from './manage_roles_row';
import {
  setSelectedTags,
  buildCategoryMap,
  setChainCategories,
} from './helpers';

type ChainOrCommMetadataManagementAttrs = {
  admins: any;
  chain?: ChainInfo;
  mods: any;
  onRoleUpdate: (oldRole: string, newRole: string) => void;
};

export class ChainMetadataManagementTable
  implements m.ClassComponent<ChainOrCommMetadataManagementAttrs>
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
  customDomain: string;
  terms: string;
  defaultSummaryView: boolean;
  network: ChainNetwork;
  symbol: string;
  snapshot: string[];
  selectedTags: { [type in ChainCategoryType]?: boolean };
  categoryMap: { [type in ChainCategoryType]?: number };
  uploadInProgress: boolean;

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
    this.customDomain = vnode.attrs.chain.customDomain;
    this.terms = vnode.attrs.chain.terms;
    this.iconUrl = vnode.attrs.chain.iconUrl;
    this.network = vnode.attrs.chain.network;
    this.symbol = vnode.attrs.chain.symbol;
    this.snapshot = vnode.attrs.chain.snapshot;
    this.defaultSummaryView = vnode.attrs.chain.defaultSummaryView;
    this.selectedTags = setSelectedTags(vnode.attrs.chain.id);
    this.categoryMap = buildCategoryMap();
  }

  view(vnode: any) {
    return m('.ChainMetadataManagementTable', [
      m(AvatarUpload, {
        avatarScope: AvatarScope.Chain,
        uploadStartedCallback: () => {
          this.uploadInProgress = true;
          m.redraw();
        },
        uploadCompleteCallback: (files) => {
          files.forEach((f) => {
            if (!f.uploadURL) return;
            const url = f.uploadURL.replace(/\?.*/, '');
            this.iconUrl = url;
            $(vnode.dom).find('input[name=avatarUrl]').val(url.trim());
          });
          this.uploadInProgress = false;
          m.redraw();
        },
      }),
      m(
        Table,
        {
          bordered: false,
          interactive: false,
          striped: false,
          class: 'metadata-management-table',
        },
        [
          m(InputRow, {
            title: 'Name',
            defaultValue: this.name,
            onChangeHandler: (v) => {
              this.name = v;
            },
          }),
          m(InputRow, {
            title: 'Description',
            defaultValue: this.description,
            onChangeHandler: (v) => {
              this.description = v;
            },
            textarea: true,
          }),
          m(InputRow, {
            title: 'Website',
            defaultValue: this.website,
            placeholder: 'https://example.com',
            onChangeHandler: (v) => {
              this.website = v;
            },
          }),
          m(InputRow, {
            title: 'Discord',
            defaultValue: this.discord,
            placeholder: 'https://discord.com/invite',
            onChangeHandler: (v) => {
              this.discord = v;
            },
          }),
          m(InputRow, {
            title: 'Element',
            defaultValue: this.element,
            placeholder: 'https://matrix.to/#',
            onChangeHandler: (v) => {
              this.element = v;
            },
          }),
          m(InputRow, {
            title: 'Telegram',
            defaultValue: this.telegram,
            placeholder: 'https://t.me',
            onChangeHandler: (v) => {
              this.telegram = v;
            },
          }),
          m(InputRow, {
            title: 'Github',
            defaultValue: this.github,
            placeholder: 'https://github.com',
            onChangeHandler: (v) => {
              this.github = v;
            },
          }),
          m(ToggleRow, {
            title: 'Stages',
            defaultValue: vnode.attrs.chain.stagesEnabled,
            onToggle: (checked) => {
              this.stagesEnabled = checked;
            },
            caption: (checked) =>
              checked
                ? 'Show proposal progress on threads'
                : "Don't show progress on threads",
          }),
          m(ToggleRow, {
            title: 'Summary view',
            defaultValue: vnode.attrs.chain.defaultSummaryView,
            onToggle: (checked) => {
              this.defaultSummaryView = checked;
            },
            caption: (checked) =>
              checked
                ? 'Discussion listing defaults to summary view'
                : 'Discussion listing defaults to latest activity view',
          }),
          m(InputRow, {
            title: 'Custom Stages',
            defaultValue: this.customStages,
            placeholder: '["Temperature Check", "Consensus Check"]',
            onChangeHandler: (v) => {
              this.customStages = v;
            },
          }),
          m(InputRow, {
            title: 'Domain',
            defaultValue: this.customDomain,
            placeholder: 'Contact support', // gov.edgewa.re
            onChangeHandler: (v) => {
              this.customDomain = v;
            },
            disabled: true, // Custom domains should be admin configurable only
          }),
          app.chain?.meta.chain.base === ChainBase.Ethereum &&
            m(InputRow, {
              title: 'Snapshot(s)',
              defaultValue: this.snapshot,
              placeholder: this.network,
              onChangeHandler: (v) => {
                const snapshots = v
                  .split(',')
                  .map((val) => val.trim())
                  .filter((val) => val.length > 4);
                this.snapshot = snapshots;
              },
            }),
          m(InputRow, {
            title: 'Terms of Service',
            defaultValue: this.terms,
            placeholder: 'Url that new users see',
            onChangeHandler: (v) => {
              this.terms = v;
            },
          }),
          m('.tag-row', [
            m('label', 'Community Tags'),
            m('.tag-group', [
              Object.keys(this.selectedTags).map((key) => {
                return m(CWButton, {
                  label: key,
                  className: 'filter-button',
                  buttonType: this.selectedTags[key] ? 'primary' : 'secondary',
                  onclick: () => {
                    this.selectedTags[key] = !this.selectedTags[key];
                  },
                });
              }),
            ]),
          ]),
          m('tr', [
            m('td', 'Admins'),
            m('td', [
              m(ManageRolesRow, {
                roledata: vnode.attrs.admins,
                onRoleUpdate: (x, y) => {
                  vnode.attrs.onRoleUpdate(x, y);
                },
              }),
            ]),
          ]),
          vnode.attrs.mods.length > 0 &&
            m('tr', [
              m('td', 'Moderators'),
              m('td', [
                m(ManageRolesRow, {
                  roledata: vnode.attrs.mods,
                  onRoleUpdate: (x, y) => {
                    vnode.attrs.onRoleUpdate(x, y);
                  },
                }),
              ]),
            ]),
        ]
      ),
      m('.button-wrap', [
        m(Button, {
          class: 'save-changes-button',
          disabled: this.uploadInProgress,
          label: 'Save changes',
          intent: 'primary',
          onclick: async () => {
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
              snapshot,
              terms,
              iconUrl,
              defaultSummaryView,
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
                  vnode.attrs.chain.id,
                  this.categoryMap[category],
                  this.selectedTags[category]
                );
              }
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
                defaultSummaryView,
              });
              notifySuccess('Chain updated');
            } catch (err) {
              notifyError(err.responseJSON?.error || 'Chain update failed');
            }
          },
        }),
      ]),
    ]);
  }
}
