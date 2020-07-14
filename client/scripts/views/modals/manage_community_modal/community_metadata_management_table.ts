import $ from 'jquery';
import m from 'mithril';
import { Table, Button } from 'construct-ui';

import { CommunityInfo, ChainInfo } from 'client/scripts/models';
import { InputPropertyRow, TogglePropertyRow, ManageRolesRow } from './metadata_rows';

interface ICommunityMetadataManagementState {
  name: string;
  chat: string;
  description: string;
  invitesValue: boolean;
  privacyValue: boolean;
  website: string;
}

export interface IChainOrCommMetadataManagementAttrs {
  community?: CommunityInfo;
  chain?: ChainInfo;
  onRoleUpdate: Function;
  admins;
  mods;
}

const urlHasValidPrefix = (url: string) => {
  return (url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
};

const CommunityMetadataManagementTable:
m.Component<IChainOrCommMetadataManagementAttrs, ICommunityMetadataManagementState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.community.name;
    vnode.state.description = vnode.attrs.community.description;
    // vnode.state.website = vnode.attrs.community.website;
    // vnode.state.chat = vnode.attrs.community.chat;
  },
  view: (vnode) => {
    return m('.CommunityMetadataManagementTable', [m(Table, {
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
        defaultValue: vnode.attrs.community.website,
        placeholder: 'https://example.com',
        onChangeHandler: (v) => { vnode.state.website = v; },
      }),
      m(InputPropertyRow, {
        title: 'Chat',
        defaultValue: vnode.attrs.community.chat,
        placeholder: 'https://discord.gg',
        onChangeHandler: (v) => { vnode.state.chat = v; },
      }),
      m(TogglePropertyRow, {
        title: 'Private Community?',
        defaultValue: vnode.attrs.community.privacyEnabled,
        onToggle: (checked) => { vnode.state.privacyValue = checked; },
      }),
      m(TogglePropertyRow, {
        title: 'Invites Enabled?',
        defaultValue: vnode.attrs.community.invitesEnabled,
        onToggle: (checked) => { vnode.state.invitesValue = checked; },
      }),
      m('tr', [
        m('td', 'Admins'),
        m('td', [ m(ManageRolesRow, {
          roledata: vnode.attrs.admins,
          onRoleUpdate: (oldRole, newRole) => { vnode.attrs.onRoleUpdate(oldRole, newRole); },
        }), ]),
      ]),
      vnode.attrs.mods.length > 0
        && m('tr', [
          m('td', 'Moderators'),
          m('td', [ m(ManageRolesRow, {
            roledata: vnode.attrs.mods,
            onRoleUpdate: (oldRole, newRole) => { vnode.attrs.onRoleUpdate(oldRole, newRole); },
          }), ])
        ]),
    ]),
    m(Button, {
      label: 'Save changes',
      intent: 'primary',
      onclick: async (e) => {
        const {
          chat,
          description,
          invitesValue,
          name,
          privacyValue,
          website,
        } = vnode.state;
        await vnode.attrs.community.updateCommunityData({
          name,
          description,
          privacyValue,
          invitesValue,
          website,
          chat,
        });
        $(e.target).trigger('modalexit');
      },
    }),
    ]);
  },
};

export default CommunityMetadataManagementTable;
