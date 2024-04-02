import updateRoles from 'client/scripts/state/api/members/updateRoles';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useFetchAdminQuery from 'state/api/members/fetchAdmin';
import { User } from 'views/components/user/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import RoleInfo from '../../../../../models/RoleInfo';
import { CWIcon } from '../../../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../../../components/component_kit/cw_label';
import './ManageRoles.scss';

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

  let roleToBeDeleted;
  const { useRemoveRolesMutation } = updateRoles;
  const { data: removedRoleData, mutateAsync: removeRole } =
    useRemoveRolesMutation({
      onRoleUpdate,
      roleToBeDeleted,
    });

  const { data: { admins: returnedAdmins, mods: returnedMods } = {} } =
    useFetchAdminQuery({
      communityId: app.activeChainId(),
    });

  const handleDeleteRole = async (role: RoleInfo) => {
    roleToBeDeleted = role;
    const isSelf =
      role.Address.address === app.user.activeAccount?.address &&
      role.community_id === app.user.activeAccount?.community.id;

    const roleBelongsToUser = !!app.user.addresses.filter(
      (addr_) => addr_.id === (role.address_id || role.Address.id),
    ).length;

    const arrayedTestData = [...returnedAdmins, ...returnedMods];

    const userAdminsAndMods = arrayedTestData.filter((role_) => {
      const belongsToUser = !!app.user.addresses.filter(
        (addr_) => addr_.id === role_.address_id,
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
        (r) => r.permission === 'moderator',
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
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            await removeRole({ roleToBeDeleted, onRoleUpdate });
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
                userAddress={addr.address}
                userCommunityId={role.community_id}
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
