/* @jsx m */

import ClassComponent from 'class_component';
import { notifyError } from 'controllers/app/notifications';
import $ from 'jquery';
import m from 'mithril';
import type { RoleInfo } from 'models';

import 'pages/manage_community/manage_roles.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../components/component_kit/cw_label';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import AddressAccount from 'models/AddressAccount';

type ManageRoleRowAttrs = {
  label: string;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roledata?: Array<RoleInfo>;
};

export class ManageRoles extends ClassComponent<ManageRoleRowAttrs> {
  view(vnode: m.Vnode<ManageRoleRowAttrs>) {
    if (!vnode.attrs.roledata || vnode.attrs.roledata.length === 0) return;

    const chainOrCommObj = { chain: app.activeChainId() };
    const communityMeta = app.chain.meta;

    return (
      <div class="ManageRoles">
        <CWLabel label={vnode.attrs.label} />
        <div class="roles-container">
          {vnode.attrs.roledata?.map((role) => {
            const addr = role.Address;

            const isSelf =
              role.Address.address === app.user.activeAddressAccount?.address &&
              role.chain_id === app.user.activeAddressAccount?.chain.id;

            const roleBelongsToUser = !!app.user.addresses.filter(
              (addr_) =>
                addr_.addressId === (role.address_id || role.Address.addressId)
            ).length;
            return (
              <div class="role-row">
                {m(User, {
                  user: new AddressAccount({
                    addressId: addr.addressId,
                    address: addr.address,
                    chain: app.config.chains.getById(role.chain_id),
                    walletId: addr.walletId,
                  }),
                  popover: true,
                  linkify: false,
                  hideAvatar: false,
                })}
                <CWIcon
                  iconName="close"
                  iconSize="small"
                  onclick={async () => {
                    const adminsAndMods = await communityMeta.getMembers(
                      app.activeChainId()
                    );

                    const userAdminsAndMods = adminsAndMods.filter((role_) => {
                      return !!app.user.addresses.filter(
                        (addr_) => addr_.addressId === role_.address_id
                      ).length;
                    });

                    // if (role.permission === 'admin') {
                    //   const admins = (adminsAndMods || []).filter((r) => r.permission === 'admin');
                    //   if (admins.length < 2) {
                    //     notifyError('Communities must have at least one admin.');
                    //     return;
                    //   }
                    // }

                    const onlyModsRemaining = () => {
                      const modCount = userAdminsAndMods.filter(
                        (r) => r.permission === 'moderator'
                      ).length;

                      const remainingRoleCount = userAdminsAndMods.length - 1;
                      return modCount === remainingRoleCount;
                    };

                    const isLosingAdminPermissions =
                      (userAdminsAndMods.length === 1 && isSelf) ||
                      (roleBelongsToUser &&
                        role.permission === 'admin' &&
                        onlyModsRemaining());

                    if (isLosingAdminPermissions) {
                      const query = `You will lose all ${role.permission} permissions in this community. Continue?`;
                      const confirmed = await confirmationModalWithText(
                        query,
                        'Yes',
                        'No'
                      )();
                      if (!confirmed) return;
                    } else {
                      const query = `Remove this ${role.permission}?`;
                      const confirmed = await confirmationModalWithText(
                        query,
                        'Yes',
                        'No'
                      )();
                      if (!confirmed) return;
                    }

                    try {
                      const res = await $.post(
                        `${app.serverUrl()}/upgradeMember`,
                        {
                          ...chainOrCommObj,
                          new_role: 'member',
                          address: role.Address.address,
                          jwt: app.user.jwt,
                        }
                      );

                      if (res.status !== 'Success') {
                        throw new Error(
                          `Got unsuccessful status: ${res.status}`
                        );
                      }

                      const newRole = res.result;
                      vnode.attrs.onRoleUpdate(role, newRole);

                      if (isLosingAdminPermissions) {
                        m.route.set(`/${app.activeChainId()}`);
                      }
                    } catch (err) {
                      const errMsg =
                        err.responseJSON?.error || 'Failed to alter role.';
                      notifyError(errMsg);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
