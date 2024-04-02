import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import RoleInfo from '../../../models/RoleInfo';

type UpgradeRolesProps = {
  onRoleUpdate: (oldRole, newRole) => any;
  newRole: string;
  upgradedUser;
};

type RemoveRoleProps = {
  roleToBeDeleted;
  onRoleUpdate: (oldRole, newRole) => void;
};

const upgradeRoles = async ({ upgradedUser, newRole }: UpgradeRolesProps) => {
  const communityObj = { chain: app.activeChainId() };
  const res = await axios.post(`${app.serverUrl()}/upgradeMember`, {
    new_role: newRole,
    address: upgradedUser.Address.address,
    ...communityObj,
    jwt: app.user.jwt,
  });

  if (res.data.status === 'Success') {
    const roleData = res.data.result;

    const createdRole = new RoleInfo({
      id: roleData.id,
      address_id: roleData.address_id,
      address_chain: roleData.community_id,
      address: roleData.address,
      community_id: roleData.community_id,
      permission: roleData.permission,
      allow: roleData.allow,
      deny: roleData.deny,
      is_user_default: roleData.is_user_default,
      Address: upgradedUser.Address,
    });

    return { newRole: createdRole, upgradedUser: upgradedUser };
  } else {
    throw new Error('Unable to upgrade user');
  }
};

const useUpgradeRolesMutation = ({ onRoleUpdate }: UpgradeRolesProps) => {
  return useMutation({
    mutationFn: upgradeRoles,
    onSuccess: (data) => {
      onRoleUpdate(data.upgradedUser, data.newRole);
    },
  });
};

const removeRole = async ({ roleToBeDeleted }: RemoveRoleProps) => {
  const communityObj = { chain: app.activeChainId() };
  const res = await axios.post(`${app.serverUrl()}/upgradeMember`, {
    ...communityObj,
    new_role: 'member',
    address: roleToBeDeleted.Address.address,
    jwt: app.user.jwt,
  });

  if (res.data.status === 'Success') {
    const roleData = res.data.result;
    const newRole = new RoleInfo({
      id: roleData.id,
      address_id: roleData.address_id,
      address_chain: roleData.community_id,
      address: roleData.address,
      community_id: roleData.community_id,
      permission: roleData.permission,
      allow: roleData.allow,
      deny: roleData.deny,
      is_user_default: roleData.is_user_default,
    });
    return { roleToBeDeleted, newRole };
  } else {
    throw new Error('Unable to remove user');
  }
};

const useRemoveRolesMutation = ({ onRoleUpdate }: RemoveRoleProps) => {
  return useMutation({
    mutationFn: removeRole,
    onSuccess: async (data) => {
      onRoleUpdate(data.roleToBeDeleted, data.newRole);
    },
  });
};

const updateRoles = {
  useRemoveRolesMutation,
  useUpgradeRolesMutation,
};

export default updateRoles;
