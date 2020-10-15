import m from 'mithril';
import $ from 'jquery';
import { Input, TextArea, Icon, Icons, Switch } from 'construct-ui';

import app from 'state';
import User from 'views/components/widgets/user';
import { AddressInfo } from 'models';

export const ManageRolesRow: m.Component<{ roledata?, onRoleUpdate?: Function }> = {
  view: (vnode) => {
    if (!vnode.attrs.roledata || vnode.attrs.roledata.length === 0) return;
    const chainOrCommObj = app.community
      ? { community: app.activeCommunityId() }
      : { chain: app.activeChainId() };

    return m('.ManageRoleRow', [
      vnode.attrs.roledata?.map((role) => {
        const addr = role.Address;
        const isSelf = role.Address.address === app.user.activeAccount?.address
          && role.Address.chain === app.user.activeAccount?.chain.id;
        return m('.RoleChild', [
          m(User, {
            user: new AddressInfo(addr.id, addr.address, addr.chain, null), //role.Address, // make AddressInfo?
            popover: true,
            linkify: false,
            hideAvatar: false,
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

export const InputPropertyRow: m.Component<{
  title: string,
  defaultValue: string,
  disabled?: boolean,
  onChangeHandler: Function,
  placeholder?: string,
  textarea?: boolean,
}> = {
  view: (vnode) => {
    const { title, defaultValue, disabled, onChangeHandler, placeholder, textarea } = vnode.attrs;

    return m('tr.InputPropertyRow', [
      m('td', { class: 'title-column', }, title),
      m('td', [
        m((textarea ? TextArea : Input), {
          defaultValue,
          placeholder,
          fluid: true,
          disabled: disabled || false,
          onkeyup: (e) => { onChangeHandler((e.target as any).value); },
        }),
      ]),
    ]);
  }
};

export const TogglePropertyRow: m.Component<{
  title: string,
  defaultValue: boolean,
  disabled?: boolean,
  onToggle: Function,
  caption?: Function,
}, { checked: boolean }> = {
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
        }),
        vnode.attrs.caption && m('.switch-caption', vnode.attrs.caption(vnode.state.checked)),
      ])
    ]);
  },
};
