import m from 'mithril';
import $ from 'jquery';
import { Input, TextArea, Icon, Icons, Switch } from 'construct-ui';

import app from 'state';
import User from 'views/components/widgets/user';
import { AddressInfo } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { confirmationModalWithText } from '../confirm_modal';

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
            popover: false,
            linkify: false,
            hideAvatar: false,
          }),
          m(Icon, {
            name: Icons.X,
            size: 'xs',
            class: 'role-x-icon',
            onclick: async () => {
              const communityMeta = app.community
                ? app.community.meta
                : app.chain.meta.chain;
              const adminsAndMods = await communityMeta.getAdminsAndMods(app.activeId());
              if (adminsAndMods?.length < 2) {
                notifyError('Communities must have at least one admin.');
                return;
              }
              const userAdminRoles = app.user.getAllRolesInCommunity({ community: app.activeId() })
                .filter((r) => r.permission === 'admin');
              console.log(adminsAndMods);
              console.log(userAdminRoles);
              if (userAdminRoles.length < 2 && isSelf) {
                const query = 'You will lose all admin permissions in this community. Continue?';
                const confirmed = await confirmationModalWithText(query, 'Yes', 'No')();
                if (!confirmed) return;
              }
              const options = {
                address: role.Address.address,
                community: app.activeCommunityId(),
                chain: app.activeChainId(),
                newRole: 'member'
              };
              const res = app.user.updateRole(options);
              console.log(res);
              // const newRole = res.result;
              // vnode.attrs.onRoleUpdate(role, newRole);
              // If user loses admin permissions, ensure they instantly lose access to 
              // all relevant UI
              if (userAdminRoles.length < 2 && isSelf) {
                $('.ManageCommunityModal').trigger('modalforceexit');
              }
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
