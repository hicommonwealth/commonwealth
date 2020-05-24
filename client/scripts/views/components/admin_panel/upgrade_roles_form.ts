import m from 'mithril';
import $ from 'jquery';
import { RolePermission } from 'models';
import { RadioGroup, Button } from 'construct-ui';
import app from 'state';


interface IUpgradeRolesFormAttrs {
  roleData: any[];
  onRoleUpgrade: Function;
}

interface IUpgradeRolesFormState {
  role: string;
  user: string;
}

const UpgradeRolesForm: m.Component<IUpgradeRolesFormAttrs, IUpgradeRolesFormState> = {
  view: (vnode) => {
    const { roleData, onRoleUpgrade } = vnode.attrs;
    const noAdmins = roleData.filter((role) => {
      return (role.permission === RolePermission.member) || (role.permission === RolePermission.moderator);
    });
    const names: string[] = noAdmins.map((role) => {
      const displayName = app.profiles.getProfile(role.Address.chain, role.Address.address).displayName;
      const roletext = (role.permission === 'moderator') ? '(moderator)' : '';
      return `${displayName}: ${role.Address.address.slice(0, 6)}...${roletext}`;
    });
    const chainOrCommObj = app.community
      ? { community: app.activeCommunityId() }
      : { chain: app.activeChainId() };
    return m('.UpgradeRolesForm', [
      m('h3', 'Select Member:'),
      m(RadioGroup, {
        name: 'members/mods',
        class: 'members-list',
        options: names,
        value: vnode.state.user,
        onchange: (e: Event) => { vnode.state.user = (e.currentTarget as HTMLInputElement).value; },
      }),
      m('h3', 'Role Type:'),
      m(RadioGroup, {
        name: 'roles',
        options: ['Admin', 'Moderator'],
        value: vnode.state.role,
        onchange: (e: Event) => { vnode.state.role = (e.currentTarget as HTMLInputElement).value; },
      }),
      m(Button, {
        class: 'admin-tab-panel-button',
        label: 'Upgrade Member',
        onclick: () => {
          const indexOfName = names.indexOf(vnode.state.user);
          const user = noAdmins[indexOfName];
          const newRole = (vnode.state.role === 'Admin') ? 'admin'
            : (vnode.state.role === 'Moderator') ? 'moderator' : '';
          if (!user) return;
          $.post(`${app.serverUrl()}/upgradeMember`, {
            new_role: newRole,
            address: user.Address.address,
            ...chainOrCommObj,
            jwt: app.login.jwt,
          }).then((r) => {
            onRoleUpgrade(user, r.result);
          });
        },
      }),
    ]);
  }
};

export default UpgradeRolesForm;
