import $ from 'jquery';
import app from 'state';

import {
  AddressInfo,
  RoleInfo,
  Account,
  RolePermission,
  ChainInfo,
} from 'models';
import Base from './base';

const getPermissionLevel = (permission: RolePermission | undefined) => {
  switch (permission) {
    case undefined: return 0;
    case RolePermission.member: return 1;
    case RolePermission.moderator: return 2;
    case RolePermission.admin: return 3;
    default: return 4;
  }
};

export default class extends Base {
  public getChainRoles(): RoleInfo[] {
    return this.roles.filter((role) => role.chain_id);
  }

  public createRole(options: {
    address: AddressInfo,
    chain?: string,
    community?: string,
  }): JQueryPromise<void> {
    // TODO: Change to POST /role
    return $.post('/api/createRole', {
      jwt: this.jwt,
      address_id: options.address.id,
      ...options,
    }).then((result) => {
      // handle state updates
      this.addRole(result.result.role);
    });
  }

  public deleteRole(options: { address: AddressInfo, chain?: string, community?: string }): JQueryPromise<void> {
    // TODO: Change to DELETE /role
    return $.post('/api/deleteRole', {
      jwt: this.jwt,
      address_id: options.address.id,
      ...options,
    }).then((result) => {
      if (result.status !== 'Success') {
        throw new Error(`Got unsuccessful status: ${result.status}`);
      }
      // handle state updates
      if (options.chain) {
        this.removeRole((r) => {
          return r.chain_id === options.chain && r.address_id === options.address.id;
        });
      }
    });
  }

  public acceptInvite(options: { address: string, inviteCode: any}): JQueryPromise<void> {
    return $.post(`${app.serverUrl()}/acceptInvite`, {
      address: options.address,
      reject: false,
      inviteCode: options.inviteCode,
      jwt: this.jwt,
    }).then((result) => {
      this.addRole(result.result.role);
    });
  }

  public rejectInvite(options: { inviteCode: any }) {
    return $.post(`${app.serverUrl()}/acceptInvite`, {
      inviteCode: options.inviteCode,
      reject: true,
      jwt: app.user.jwt,
    });
  }

  // TODO: clarify differences between getRoleInCommunity, getRoleOfCommunity, isRoleOfCommunity, getAllRolesInCommunity

  /**
   * Retrieves the role of a specific account in the active roles set
   * @param account An arbitrary Commonwealth account
   * @param options A chain or a community ID
   */
  public getRoleInCommunity(options: { account?: Account, chain?: string }): RoleInfo {
    const account = options.account || this.activeAccount;
    if (!account) return;

    const address_id = this.addresses.find((a) => {
      return a.address === account.address && a.chain.id === account.chain.id;
    })?.id;

    return this.roles.find((r) => {
      const addressMatches = r.address_id === address_id;
      const communityMatches = r.chain_id === options.chain
      return addressMatches && communityMatches;
    });
  }

  /**
   * Retrieves the role record if one exists for the active user
   * @param role Either 'admin', 'moderator', or 'member'
   * @param options A chain or a community ID
   */
  public getRoleOfCommunity(options: { role: string, chain?: string, community?: string }): RoleInfo {
    if (!this.activeAccount || !app.isLoggedIn() || this.addresses.length === 0 || this.roles.length === 0) return;
    return this.roles.find((r) => {
      const permission = (r.permission === options.role);
      const referencedAddress = this.addresses.find((address) => address.id === r.address_id);
      if (!referencedAddress) return;
      const isSame = this.activeAccount.address === referencedAddress.address;
      const ofCommunity = r.chain_id === options.chain
      return permission && referencedAddress && isSame && ofCommunity;
    });
  }

  /**
   * Asserts whether the active roles contains a role for a given chain/community
   * @param role Either 'admin', 'moderator', or 'member'
   * @param options A chain or a community ID
   */
  public isRoleOfCommunity(options: { role: string, chain?: string, community?: string }): boolean {
    return !!this.getRoleOfCommunity(options);
  }

  /**
   * Filters all active roles by a specific chain/commnity
   * @param options A chain or a community ID
   */
  public getAllRolesInCommunity(options: { chain?: string }) {
    return this.roles.filter((r) => {
      return r.chain_id === options.chain
    });
  }

  /**
   * Grabs all corresponding addresses from the set
   * of active roles for a given chain/community.
   * @param options A chain or a community ID
   */
  getAddressIdsFromRoles(options: { chain: string; community: string; }): number[] {
    return this.roles
      .filter((role) => role.chain_id === options.chain)
      .map((role) => role.address_id)
  }

  /**
   * Grabs all joinable addresses for a potential chain/community
   * @param options A chain or a community ID
   */
  getJoinableAddresses(options: { chain?: string, community?: string }): AddressInfo[] {
    return (options.chain)
      ? this.addresses.filter((a) => a.chain.id === options.chain)
      : this.addresses;
  }

  public getChainsOfRoles(): string[] {
    return this.roles
      .filter((role) => role.chain_id)
      .map((r) => r.chain_id);
  }

  public getActiveAccountsByRole(): [Account, RoleInfo][] {
    const activeAccountsByRole = this.activeAccounts.map((account) => {
      const role = this.getRoleInCommunity({
        account,
        chain: app.activeChainId(),
      });
      return [account, role];
    });
    const filteredActiveAccountsByRole = activeAccountsByRole.reduce((
      arr: [Account, RoleInfo][],
      current: [Account, RoleInfo]
    ) => {
      const index = arr.findIndex((item) => item[0].address === current[0].address);
      if (index < 0) {
        return [...arr, current];
      }
      if (getPermissionLevel(arr[index][1]?.permission) < getPermissionLevel(current[1]?.permission)) {
        return [...arr.splice(0, index), current, ...arr.splice(index + 1)];
      }
      return arr;
    }, []);

    return filteredActiveAccountsByRole;
  }

  /**
   * Given a chain/community ID, determines if the
   * active account is an admin of the specified community.
   * @param options A chain or a community ID
   */
  public isAdminOfEntity(options: { chain?: string }): boolean {
    if (!this.activeAccount) return false;
    if (app.user.isSiteAdmin) return true;

    const adminRole = this.roles.find((role) => {
      return role.address === this.activeAccount.address
        && role.permission === RolePermission.admin
        && ((options.chain && role.chain_id === options.chain));
    });

    return !!adminRole;
  }

  /**
   * Checks membership in a community
   * @param address Address being checked for membership
   * @param options A chain or community ID
   * TODO: Should we default to this.activeAccount if address is null?
   */
  public isMember(options: {
    account: AddressInfo | Account | undefined,
    chain?: string,
    community?: string
  }): boolean {
    const addressinfo: AddressInfo | undefined = (options.account instanceof Account)
      ? this.addresses.find((a) => (
        options.account.address === a.address
          && (options.account.chain as ChainInfo).id === a.chain.id
      ))
      : options.account;
    const roles = this.roles.filter((role) => addressinfo
      ? role.address_id === addressinfo.id
      : true);
    if (options.chain) {
      return roles.map((r) => r.chain_id).indexOf(options.chain) !== -1;
    } else {
      return false;
    }
  }
}
