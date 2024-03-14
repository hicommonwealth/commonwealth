import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import type RoleInfo from '../../../models/RoleInfo';

type UpgradeRolesProps = {
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  newRole: string;
  upgradedUser;
};

const upgradeRoles = async ({
  onRoleUpdate,
  upgradedUser,
  newRole,
}: UpgradeRolesProps) => {
  const communityObj = { chain: app.activeChainId() };

  try {
    const res = await axios.post(`${app.serverUrl()}/upgradeMember`, {
      new_role: newRole,
      address: upgradedUser.Address.address,
      ...communityObj,
      jwt: app.user.jwt,
    });
    onRoleUpdate(upgradedUser, res.data.result);
    notifySuccess('Member upgraded');
  } catch (error) {
    notifyError('Upgrade failed');
  }
};

export default upgradeRoles;
