import $ from 'jquery';
import m from 'mithril';
import { Button, Table } from 'construct-ui';

import { ChainNetwork } from 'client/scripts/models';
import { IChainOrCommMetadataManagementAttrs, urlHasValidPrefix } from './community_metadata_management_table';
import { InputPropertyRow, ManageRolesRow } from './metadata_rows';

interface IChainMetadataManagementState {
  name: string;
  description: string;
  website: string;
  chat: string;
  url: string;
  loadingFinished: boolean;
  loadingStarted: boolean;
  iconUrl: string;
  network: ChainNetwork;
  symbol: string;
}

const ChainMetadataManagementTable: m.Component<IChainOrCommMetadataManagementAttrs, IChainMetadataManagementState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.chain.name;
    vnode.state.description = vnode.attrs.chain.description;
    vnode.state.website = vnode.attrs.chain.website;
    vnode.state.chat = vnode.attrs.chain.chat;
    vnode.state.iconUrl = vnode.attrs.chain.iconUrl;
    vnode.state.network = vnode.attrs.chain.network;
    vnode.state.symbol = vnode.attrs.chain.symbol;
  },
  view: (vnode) => {
    return m('.ChainMetadataManagementTable', [
      m(Table, {
        bordered: false,
        interactive: false,
        striped: false,
        class: 'metadata-management-table',
      }, [
        m(InputPropertyRow, {
          title: 'Name',
          defaultValue: vnode.state.name,
          onChangeHandler: (v) => { vnode.state.name = v; },
        }),
        m(InputPropertyRow, {
          title: 'Description',
          defaultValue: vnode.state.description,
          onChangeHandler: (v) => { vnode.state.description = v; },
          textarea: true,
        }),
        m(InputPropertyRow, {
          title: 'Website',
          defaultValue: vnode.state.website,
          placeholder: 'https://example.com',
          onChangeHandler: (v) => { vnode.state.website = v; },
        }),
        m(InputPropertyRow, {
          title: 'Chat',
          defaultValue: vnode.state.chat,
          placeholder: 'https://discord.gg',
          onChangeHandler: (v) => { vnode.state.chat = v; },
        }),
        m(InputPropertyRow, {
          title: 'Network',
          defaultValue: vnode.state.network,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.network = v; },
        }),
        m(InputPropertyRow, {
          title: 'Symbol',
          defaultValue: vnode.state.symbol,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.symbol = v; },
        }),
        m(InputPropertyRow, {
          title: 'Icon',
          defaultValue: vnode.state.iconUrl,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.iconUrl = v; },
        }),
        m('tr', [
          m('td', 'Admins'),
          m('td', [ m(ManageRolesRow, {
            roledata: vnode.attrs.admins,
            onRoleUpdate: (x, y) => { vnode.attrs.onRoleUpdate(x, y); },
          }), ]),
        ]),
        vnode.attrs.mods.length > 0
          && m('tr', [
            m('td', 'Moderators'),
            m('td', [ m(ManageRolesRow, {
              roledata: vnode.attrs.mods,
              onRoleUpdate: (x, y) => { vnode.attrs.onRoleUpdate(x, y); },
            }), ])
          ]),
      ]),
      m(Button, {
        class: 'save-changes-button',
        label: 'Save changes',
        intent: 'primary',
        onclick: async (e) => {
          const { name, description, website, chat } = vnode.state;
          if (chat.length && !urlHasValidPrefix(chat)) {
            // Error handling
          }
          if (website.length && !urlHasValidPrefix(website)) {
            // Error handling
          }
          await vnode.attrs.chain.updateChainData(name, description, website, chat);
          $(e.target).trigger('modalexit');
        },
      }),
    ]);
  },
};

export default ChainMetadataManagementTable;
