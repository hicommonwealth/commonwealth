import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import { Button, Table } from 'construct-ui';

import { ChainNetwork } from 'models';
import { notifyError } from 'controllers/app/notifications';
import Token from 'controllers/chain/ethereum/token/adapter';
import { IChainOrCommMetadataManagementAttrs } from './community_metadata_management_table';
import {
  TogglePropertyRow,
  InputPropertyRow,
  ManageRolesRow,
} from './metadata_rows';
import AvatarUpload from '../../components/avatar_upload';

interface IChainMetadataManagementState {
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
  network: ChainNetwork;
  symbol: string;
  snapshot: string;
  uploadInProgress: boolean;
}

const ChainMetadataManagementTable: m.Component<
  IChainOrCommMetadataManagementAttrs,
  IChainMetadataManagementState
> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.chain.name;
    vnode.state.description = vnode.attrs.chain.description;
    vnode.state.website = vnode.attrs.chain.website;
    vnode.state.discord = vnode.attrs.chain.discord;
    vnode.state.element = vnode.attrs.chain.element;
    vnode.state.telegram = vnode.attrs.chain.telegram;
    vnode.state.github = vnode.attrs.chain.github;
    vnode.state.stagesEnabled = vnode.attrs.chain.stagesEnabled;
    vnode.state.customStages = vnode.attrs.chain.customStages;
    vnode.state.customDomain = vnode.attrs.chain.customDomain;
    vnode.state.terms = vnode.attrs.chain.terms;
    vnode.state.iconUrl = vnode.attrs.chain.iconUrl;
    vnode.state.network = vnode.attrs.chain.network;
    vnode.state.symbol = vnode.attrs.chain.symbol;
    vnode.state.snapshot = vnode.attrs.chain.snapshot;
  },
  view: (vnode) => {
    return m('.ChainMetadataManagementTable', [
      m(AvatarUpload, {
        uploadStartedCallback: () => {
          vnode.state.uploadInProgress = true;
        },
        uploadCompleteCallback: () => {
          vnode.state.uploadInProgress = false;
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
          m(InputPropertyRow, {
            title: 'Name',
            defaultValue: vnode.state.name,
            onChangeHandler: (v) => {
              vnode.state.name = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Description',
            defaultValue: vnode.state.description,
            onChangeHandler: (v) => {
              vnode.state.description = v;
            },
            textarea: true,
          }),
          m(InputPropertyRow, {
            title: 'Website',
            defaultValue: vnode.state.website,
            placeholder: 'https://example.com',
            onChangeHandler: (v) => {
              vnode.state.website = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Discord',
            defaultValue: vnode.state.discord,
            placeholder: 'https://discord.com/invite',
            onChangeHandler: (v) => {
              vnode.state.discord = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Element',
            defaultValue: vnode.state.element,
            placeholder: 'https://matrix.to/#',
            onChangeHandler: (v) => {
              vnode.state.element = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Telegram',
            defaultValue: vnode.state.telegram,
            placeholder: 'https://t.me',
            onChangeHandler: (v) => {
              vnode.state.telegram = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Github',
            defaultValue: vnode.state.github,
            placeholder: 'https://github.com',
            onChangeHandler: (v) => {
              vnode.state.github = v;
            },
          }),
          m(TogglePropertyRow, {
            title: 'Stages',
            defaultValue: vnode.attrs.chain.stagesEnabled,
            onToggle: (checked) => {
              vnode.state.stagesEnabled = checked;
            },
            caption: (checked) =>
              checked
                ? 'Show proposal progress on threads'
                : "Don't show progress on threads",
          }),
          m(InputPropertyRow, {
            title: 'Custom Stages',
            defaultValue: vnode.state.customStages,
            placeholder: '["Temperature Check", "Consensus Check"]',
            onChangeHandler: (v) => {
              vnode.state.customStages = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Domain',
            defaultValue: vnode.state.customDomain,
            placeholder: 'Contact support', // gov.edgewa.re
            onChangeHandler: (v) => {
              vnode.state.customDomain = v;
            },
            disabled: true, // Custom domains should be admin configurable only
          }),
          app.chain?.meta.chain.base === 'ethereum' &&
            m(InputPropertyRow, {
              title: 'Snapshot',
              defaultValue: vnode.state.snapshot,
              placeholder: vnode.state.network,
              onChangeHandler: (v) => {
                vnode.state.snapshot = v;
              },
            }),
          m(InputPropertyRow, {
            title: 'Terms of Service',
            defaultValue: vnode.state.terms,
            placeholder: 'Url that new users see',
            onChangeHandler: (v) => {
              vnode.state.terms = v;
            },
          }),
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
      m(Button, {
        class: 'save-changes-button',
        disabled: vnode.state.uploadInProgress,
        label: 'Save changes',
        intent: 'primary',
        onclick: async (e) => {
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
          } = vnode.state;

          // /^[a-z]+\.eth/
          if (
            snapshot &&
            snapshot !== '' &&
            !/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi.test(
              snapshot
            )
          ) {
            notifyError('Snapshot name must be in the form of *.eth');
            return;
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
            });
            $(e.target).trigger('modalexit');
          } catch (err) {
            notifyError(err.responseJSON?.error || 'Chain update failed');
          }
        },
      }),
    ]);
  },
};

export default ChainMetadataManagementTable;
