/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';
import $ from 'jquery';

import 'pages/manage_community/manage_roles.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { AddressInfo, RoleInfo } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../components/component_kit/cw_label';

type ManageRoleRowAttrs = {
  label: string;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roledata?: Array<RoleInfo>;
};

export class ManageRoles extends ClassComponent<ManageRoleRowAttrs> {
  view(vnode: ResultNode<ManageRoleRowAttrs>) {
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
              role.Address.address === app.user.activeAccount?.address &&
              role.chain_id === app.user.activeAccount?.chain.id;

            const roleBelongsToUser = !!app.user.addresses.filter(
              (addr_) => addr_.id === (role.address_id || role.Address.id)
            ).length;
            return (
              <div class="role-row">
                {render(User, {
                  user: new AddressInfo(
                    addr.id,
                    addr.address,
                    role.chain_id,
                    null,
                    addr.walletId
                  ), // role.Address, // make AddressInfo?
                  popover: true,
                  linkify: false,
                  hideAvatar: false,
                  hideIdentityIcon: true,
                })}
                <CWIcon
                  iconName="close"
                  iconSize="small"
                  onclick={async () => {
                    const adminsAndMods = await communityMeta.getMembers(
                      app.activeChainId()
                    );

                    const userAdminsAndMods = adminsAndMods.filter((role_) => {
                      const belongsToUser = !!app.user.addresses.filter(
                        (addr_) => addr_.id === role_.address_id
                      ).length;
                      return belongsToUser;
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
                        setRoute(`/${app.activeChainId()}`);
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
