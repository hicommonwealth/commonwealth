import m from 'mithril';
import $ from 'jquery';
import { Input, Icon, Icons, Switch } from 'construct-ui';

import app from 'state';
import User from 'views/components/widgets/user';

export const ManageRolesRow: m.Component<{ roledata?, onRoleUpdate?: Function }> = {
  view: (vnode) => {
    if (!vnode.attrs.roledata || vnode.attrs.roledata.length === 0) return;
    const chainOrCommObj = app.community
      ? { community: app.activeCommunityId() }
      : { chain: app.activeChainId() };

    return m('.ManageRoleRow', [
      vnode.attrs.roledata?.map((role) => {
        const isSelf = role.Address.address === app.user.activeAccount?.address
          && role.Address.chain === app.user.activeAccount?.chain.id;
        return m('.RoleChild', [
          m(User, {
            user: role.Address,
            tooltip: true,
          }),
          !isSelf && m(Icon, {
            name: Icons.X,
            size: 'xs',
            class: 'role-x-icon',
            onclick: async () => {
              const res = await $.post(`${app.serverUrl()}/upgradeMember`, {
                ...chainOrCommObj,
                new_role: 'member',
                address: role.Address.address,
                jwt: app.user.jwt,
              });
              if (res.status !== 'Success') {
                throw new Error(`Got unsuccessful status: ${res.status}`);
              }
              const newRole = res.result;
              vnode.attrs.onRoleUpdate(role, newRole);
            },
          }),
        ]);
      }),
    ]);
  }
};


interface IInputPropertyRowAttrs {
  title: string;
  defaultValue: string;
  disabled?: boolean;
  onChangeHandler: Function;
}

export const InputPropertyRow: m.Component<IInputPropertyRowAttrs> = {
  view: (vnode) => {
    return m('tr.InputPropertyRow', [
      m('td', { class: 'title-column', }, vnode.attrs.title),
      m('td', [
        m(Input, {
          defaultValue: vnode.attrs.defaultValue,
          fluid: true,
          disabled: vnode.attrs.disabled || false,
          onkeyup: (e) => { vnode.attrs.onChangeHandler((e.target as any).value); },
        }),
      ]),
    ]);
  }
};


interface ITogglePropertyRowAttrs {
  title: string;
  defaultValue: boolean;
  disabled?: boolean;
  onToggle: Function;
}

interface ITogglePropertyRowState {
  checked: boolean;
}

export const TogglePropertyRow: m.Component<ITogglePropertyRowAttrs, ITogglePropertyRowState> = {
  oninit: (vnode) => {
    vnode.state.checked = vnode.attrs.defaultValue;
  },
  view: (vnode) => {
    return m('tr.TogglePropertyRow', [
      m('td', vnode.attrs.title),
      m('td', [
        m(Switch, {
          checked: vnode.state.checked,
          disabled: vnode.attrs.disabled || false,
          onchange: () => {
            vnode.state.checked = !vnode.state.checked;
            vnode.attrs.onToggle(vnode.state.checked);
          },
        })
      ])
    ]);
  },
};
