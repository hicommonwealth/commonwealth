import { AddressRole } from '@hicommonwealth/shared';
import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { User } from 'views/components/user/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { CWIcon } from '../../../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../../../components/component_kit/cw_label';
import './ManageRoles.scss';

type ManageRoleRowProps = {
  label: string;
  onRoleUpdate: (oldRole: AddressRole, newRole: AddressRole) => void;
  roledata?: any[]; // RoleInfo
};

export const ManageRoles = ({
  label,
  onRoleUpdate,
  roledata,
}: ManageRoleRowProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const removeRole = async (role: AddressRole) => {
    try {
      const res = await axios.post(`${app.serverUrl()}/upgradeMember`, {
        community_id: app.activeChainId(),
        new_role: 'member',
        address: role.address,
        jwt: user.jwt,
      });

      if (res.data.status !== 'Success') {
        throw new Error(`Got unsuccessful status: ${res.data.status}`);
      }

      const roleData = res.data.result;
      const newRole: AddressRole = {
        address: roleData.address,
        role: roleData.permission,
      };
      onRoleUpdate(role, newRole);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to alter role.';
      notifyError(errMsg);
    }
  };

  const handleDeleteRole = async (role: AddressRole) => {
    const isSelf = role.address === user.activeAccount?.address;

    const roleBelongsToUser = user.addresses.some(
      ({ address }) => address === role.address,
    );

    const res = await axios.get(`${app.serverUrl()}/roles`, {
      params: {
        chain_id: app.activeChainId(),
        permissions: ['moderator', 'admin'],
      },
    });
    const returnedRoles = res.data.result;

    const userAdminsAndMods = returnedRoles.filter((role_) => {
      const belongsToUser = !!user.addresses.filter(
        (addr_) => addr_.id === role_.address_id,
      ).length;
      return belongsToUser;
    });

    const onlyModsRemaining = () => {
      const modCount = userAdminsAndMods.filter(
        (r) => r.permission === 'moderator',
      ).length;

      const remainingRoleCount = userAdminsAndMods.length - 1;
      return modCount === remainingRoleCount;
    };

    const isLosingAdminPermissions =
      (userAdminsAndMods.length === 1 && isSelf) ||
      (roleBelongsToUser && role.role === 'admin' && onlyModsRemaining());

    openConfirmation({
      title: 'Warning',
      description: isLosingAdminPermissions ? (
        <>
          You will lose all {role.role} permissions in this community. Continue?
        </>
      ) : (
        <>Remove this {role.role}?</>
      ),
      buttons: [
        {
          label: 'Remove',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            await removeRole(role);
            if (isLosingAdminPermissions) {
              navigate('/manage/moderators');
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
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
                userAddress={addr?.address}
                userCommunityId={role?.community_id}
                shouldShowAsDeleted={!addr?.address && !role?.community_id}
                shouldShowPopover
                shouldLinkProfile
                shouldHideAvatar
              />
              <CWIcon
                iconName="close"
                iconSize="small"
                onClick={() =>
                  handleDeleteRole({
                    address: role.address,
                    role: role.permission,
                  })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
