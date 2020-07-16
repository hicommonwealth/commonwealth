import $ from 'jquery';
import m from 'mithril';
import { Button, Table } from 'construct-ui';

import { ChainNetwork } from 'client/scripts/models';
import { IChainOrCommMetadataManagementAttrs } from './community_metadata_management_table';
import { InputPropertyRow, ManageRolesRow } from './metadata_rows';

interface IChainMetadataManagementState {
  name: string;
  description: string;
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
    vnode.state.url = vnode.attrs.chain.id;
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
          title: 'URL',
          defaultValue: `commonwealth.im/${vnode.state.url}`,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.url = v; },
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
          await vnode.attrs.chain.updateChainData(vnode.state.name, vnode.state.description);
          $(e.target).trigger('modalexit');
        },
      }),
    ]);
  },
};

export default ChainMetadataManagementTable;
