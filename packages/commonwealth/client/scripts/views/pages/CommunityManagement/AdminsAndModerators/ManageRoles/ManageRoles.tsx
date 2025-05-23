import { AddressRole } from '@hicommonwealth/shared';
import { useUpdateRoleMutation } from 'client/scripts/state/api/communities';
import { useGetRolesQuery } from 'client/scripts/state/api/communities/getRoles';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { User } from 'views/components/user/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { formatAddressShort } from '../../../../../helpers/index';
import { CWIcon } from '../../../../components/component_kit/cw_icons/cw_icon';
import { CWLabel } from '../../../../components/component_kit/cw_label';
import { CWText } from '../../../../components/component_kit/cw_text';
import './ManageRoles.scss';

type ManageRoleRowProps = {
  label: string;
  onRoleUpdate: (oldRole: AddressRole, newRole: AddressRole) => void;
  roledata?: AddressRole[];
};

export const ManageRoles = ({
  label,
  onRoleUpdate,
  roledata,
}: ManageRoleRowProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { mutateAsync: updateRole } = useUpdateRoleMutation();
  const { data: adminsAndModerators } = useGetRolesQuery({
    community_id: app.activeChainId()!,
    roles: ['moderator', 'admin'],
    apiEnabled: false,
  });

  const removeRole = async (role: AddressRole) => {
    const result = await updateRole({
      community_id: app.activeChainId()!,
      address: role.address,
      role: 'member',
    });
    onRoleUpdate(role, {
      address: result.address!,
      role: result.role!,
    });
  };

  const handleDeleteRole = async (role: AddressRole) => {
    const isSelf = role.address === user.activeAccount?.address;

    const roleBelongsToUser = user.addresses.some(
      ({ address }) => address === role.address,
    );

    const userAdminsAndMods =
      adminsAndModerators?.filter((addr) => {
        const belongsToUser = !!user.addresses.filter(
          (addr_) => addr_.address === addr.address,
        ).length;
        return belongsToUser;
      }) || [];

    const onlyModsRemaining = () => {
      const modCount = userAdminsAndMods.filter(
        (r) => r.role === 'moderator',
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
        {roledata?.map((r) => {
          const { role, address } = r;
          return (
            <div className="role-row" key={address}>
              <User
                userAddress={address}
                userCommunityId={app.activeChainId() || ''}
                shouldShowPopover
                shouldLinkProfile
                shouldHideAvatar
              />
              <CWText>&nbsp;- {formatAddressShort(address)}</CWText>
              <CWIcon
                iconName="close"
                iconSize="small"
                onClick={() => {
                  void (async () => {
                    await handleDeleteRole({
                      address,
                      role,
                    });
                  })();
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
