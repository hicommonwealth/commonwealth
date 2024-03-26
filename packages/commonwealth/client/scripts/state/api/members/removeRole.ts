import axios from 'axios';
import app from 'state';
import RoleInfo from '../../../models/RoleInfo';

type RemoveRoleProps = {
  role: RoleInfo;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
};

const removeRole = async ({ role, onRoleUpdate }: RemoveRoleProps) => {
  const communityObj = { chain: app.activeChainId() };

  try {
    const res = await axios.post(`${app.serverUrl()}/upgradeMember`, {
      ...communityObj,
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
    const errMsg = err.response?.data?.error || 'Failed to alter role.';
    throw new Error(errMsg);
  }
};

export default removeRole;
