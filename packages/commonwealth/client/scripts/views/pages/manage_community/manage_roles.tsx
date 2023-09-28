import React from 'react';

import { notifyError } from 'controllers/app/notifications';

import 'pages/manage_community/manage_roles.scss';

import axios from 'axios';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { User } from 'views/components/user/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import RoleInfo from '../../../models/RoleInfo';
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

  const removeRole = async (role: RoleInfo) => {
    try {
      const res = await axios.post(`${app.serverUrl()}/upgradeMember`, {
        ...chainOrCommObj,
        new_role: 'member',
        address: role.Address.address,
        jwt: app.user.jwt,
      });

      if (res.data.status !== 'Success') {
        throw new Error(`Got unsuccessful status: ${res.data.status}`);
      }

      const newRole = res.data.result;
      onRoleUpdate(role, newRole);
    } catch (err) {
      const errMsg = err.responseJSON?.error || 'Failed to alter role.';
      notifyError(errMsg);
    }
  };

  const handleDeleteRole = async (role: RoleInfo) => {
    const isSelf =
      role.Address.address === app.user.activeAccount?.address &&
      role.chain_id === app.user.activeAccount?.chain.id;

    const roleBelongsToUser = !!app.user.addresses.filter(
      (addr_) => addr_.id === (role.address_id || role.Address.id)
    ).length;

    const res = await axios.get(`${app.serverUrl()}/roles`, {
      params: {
        chain_id: app.activeChainId(),
        permissions: ['moderator', 'admin'],
      },
    });
    const adminsAndMods = res.data.result;

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
      (roleBelongsToUser && role.permission === 'admin' && onlyModsRemaining());

    openConfirmation({
      title: 'Warning',
      description: isLosingAdminPermissions ? (
        <>
          You will lose all {role.permission} permissions in this community.
          Continue?
        </>
      ) : (
        <>Remove this {role.permission}?</>
      ),
      buttons: [
        {
          label: 'Remove',
          buttonType: 'mini-red',
          onClick: async () => {
            await removeRole(role);
            if (isLosingAdminPermissions) {
              navigate(`/`);
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'mini-white',
        },
      ],
    });
  };

  return (
    <div className="ManageRoles">
      <CWLabel label={label} />
      <div className="roles-container">
        {roledata?.map((role) => {
          const addr = role.Address;

          return (
            <div className="role-row" key={addr.id}>
              <User
                userAddress={addr.address}
                userChainId={role.chain_id}
                shouldShowPopover
                shouldLinkProfile
                shouldHideAvatar
              />
              <CWIcon
                iconName="close"
                iconSize="small"
                onClick={() => handleDeleteRole(role)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
