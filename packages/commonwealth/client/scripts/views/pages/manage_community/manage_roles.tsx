import { notifyError } from 'controllers/app/notifications';
import $ from 'jquery';
import { useCommonNavigate } from 'navigation/helpers';

import 'pages/manage_community/manage_roles.scss';
import React from 'react';

import app from 'state';
import { User } from 'views/components/user/user';
import AddressInfo from '../../../models/AddressInfo';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../components/component_kit/cw_label';

type ManageRoleRowProps = {
  label: string;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roledata?: Array<RoleInfo>;
};

export const ManageRoles = ({
  label,
  onRoleUpdate,
  roledata,
}: ManageRoleRowProps) => {
  const navigate = useCommonNavigate();

  const chainOrCommObj = { chain: app.activeChainId() };
  const communityMeta = app.chain.meta;

  return (
    <div className="ManageRoles">
      <CWLabel label={label} />
      <div className="roles-container">
        {roledata?.map((role) => {
          const addr = role.Address;

          const isSelf =
            role.Address.address === app.user.activeAccount?.address &&
            role.chain_id === app.user.activeAccount?.chain.id;

          const roleBelongsToUser = !!app.user.addresses.filter(
            (addr_) => addr_.id === (role.address_id || role.Address.id)
          ).length;
          return (
            <div className="role-row" key={role.id}>
              <User
                user={
                  new AddressInfo(
                    addr.id,
                    addr.address,
                    role.chain_id,
                    null,
                    addr.walletId
                  )
                } // role.Address, // make AddressInfo?
                popover
                linkify
                hideAvatar
              />
              <CWIcon
                iconName="close"
                iconSize="small"
                onClick={async () => {
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
                    const confirmed = window.confirm(query);
                    if (!confirmed) return;
                  } else {
                    const query = `Remove this ${role.permission}?`;
                    const confirmed = window.confirm(query);
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
                      throw new Error(`Got unsuccessful status: ${res.status}`);
                    }

                    const newRole = res.result;
                    onRoleUpdate(role, newRole);

                    if (isLosingAdminPermissions) {
                      navigate(`/${app.activeChainId()}`);
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
};
