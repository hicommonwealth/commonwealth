import app from 'state';
import { RoleInfo, AddressInfo, Account } from 'models';

export function isAdmin() {
  const adminRole = app.login.roles?.find((role) => {
    return ((role.offchain_community_id === app.activeCommunityId()) || (role.chain_id === app.activeChainId()));
  });
  return adminRole;
}

export function isRoleOfCommunity(
  account: Account<any>,
  addresses: AddressInfo[],
  roles: RoleInfo[],
  role: string,
  community: string
) {
  if (!account || !app.isLoggedIn() || addresses.length === 0 || roles.length === 0) return false;
  const userRole = roles.find((r) => {
    const permission = (r.permission === role);
    const referencedAddress = addresses.find((address) => address.id === r.address_id);
    const isSame = account.address === referencedAddress.address;
    const ofCommunity = (r.chain_id === community) || (r.offchain_community_id === community);
    return permission && referencedAddress && isSame && ofCommunity;
  });
  return userRole;
}
