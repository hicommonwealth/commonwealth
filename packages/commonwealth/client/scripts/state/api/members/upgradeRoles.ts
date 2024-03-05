import { notifyError, notifySuccess } from 'controllers/app/notifications';
import $ from 'jquery';
import app from 'state';
import type RoleInfo from '../../../models/RoleInfo';

type UpgradeRolesProps = {
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  newRole: string;
  _user;
};

const upgradeRoles = async ({
  onRoleUpdate,
  _user,
  newRole,
}: UpgradeRolesProps) => {
  const communityObj = { chain: app.activeChainId() };

  $.post(`${app.serverUrl()}/upgradeMember`, {
    new_role: newRole,
    address: _user.Address.address,
    ...communityObj,
    jwt: app.user.jwt,
  }).then((r) => {
    if (r.status === 'Success') {
      notifySuccess('Member upgraded');
    } else {
      notifyError('Upgrade failed');
    }

    onRoleUpdate(_user, r.result);
  });
};

export default upgradeRoles;
