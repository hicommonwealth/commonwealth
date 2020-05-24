import m from 'mithril';
import { CommunityInfo, ChainInfo } from 'client/scripts/models';
import { Table, Button } from 'construct-ui';
import InputPropertyRow from './input_property_row';
import ManageRolesRow from './manage_roles_row';
import TogglePropertyRow from './toggle_property_row';

interface ICommunityMetadataManagementState {
  name: string;
  description: string;
  url: string;
  privacyValue: boolean;
  invitesValue: boolean;
}

export interface IChainOrCommMetadataManagementAttrs {
  community?: CommunityInfo;
  chain?: ChainInfo;
  onChangeHandler: Function;
  onRoleUpdate: Function;
  admins;
  mods;
}

const CommunityMetadataManagementTable:
m.Component<IChainOrCommMetadataManagementAttrs, ICommunityMetadataManagementState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.community.name;
    vnode.state.description = vnode.attrs.community.description;
    vnode.state.url = vnode.attrs.community.id;
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
      }),
      m(InputPropertyRow, {
        title: 'URL',
        defaultValue: `commonwealth.im/${vnode.state.url}`,
        disabled: true,
        onChangeHandler: (v) => { vnode.state.url = v; },
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
      onclick: () => {
        vnode.attrs.community.updateCommunityData(
          vnode.state.name,
          vnode.state.description,
          vnode.state.privacyValue,
          vnode.state.invitesValue,
        );
        vnode.attrs.onChangeHandler(false);
      },
    }),
    ]);
  },
};

export default CommunityMetadataManagementTable;
