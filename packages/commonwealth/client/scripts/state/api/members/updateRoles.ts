import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import type RoleInfo from '../../../models/RoleInfo';

type UpgradeRolesProps = {
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => any;
  newRole: string;
  upgradedUser;
};

type RemoveRoleProps = {
  role: RoleInfo;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
};

const upgradeRoles = async ({ upgradedUser, newRole }: UpgradeRolesProps) => {
  const communityObj = { chain: app.activeChainId() };
  const res = await axios.post(`${app.serverUrl()}/upgradeMember`, {
    new_role: newRole,
    address: upgradedUser.Address.address,
    ...communityObj,
    jwt: app.user.jwt,
  });
  return { newRole: res.data.result };
};

const useUpgradeRolesMutation = ({
  onRoleUpdate,
  upgradedUser,
}: UpgradeRolesProps) => {
  return useMutation({
    mutationFn: upgradeRoles,
    onSuccess: async (data) => {
      onRoleUpdate(upgradedUser, data.newRole);
    },
  });
};

const removeRole = async ({ role }: RemoveRoleProps) => {
  const communityObj = { chain: app.activeChainId() };

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
  return newRole;
};

const useRemoveRolesMutation = ({ onRoleUpdate }: RemoveRoleProps) => {
  return useMutation({
    mutationFn: removeRole,
    onSuccess: async (data) => {
      onRoleUpdate(data.role, data.newRole);
    },
  });
};

const updateRoles = {
  useRemoveRolesMutation,
  useUpgradeRolesMutation,
};

export default updateRoles;
