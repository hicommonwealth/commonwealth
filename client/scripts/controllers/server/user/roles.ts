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

export default class extends Base {
  public getChainRoles(): RoleInfo[] {
    return this.roles.filter((role) => !role.offchain_community_id);
  }

  public getCommunityRoles(): RoleInfo[] {
    return this.roles.filter((role) => role.offchain_community_id);
  }

  public createRole(options: { address: AddressInfo, chain?: string, community?: string }): JQueryPromise<void> {
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
      } else {
        this.removeRole((r) => {
          return r.offchain_community_id === options.community && r.address_id === options.address.id;
        });
      }
    });
  }

  public acceptInvite(options: { address: string, inviteCode: any, reject?: boolean }): JQueryPromise<void> {
    return $.post(`${app.serverUrl()}/acceptInvite`, {
      address: options.address,
      reject: (options.reject) ? options.reject : false,
      inviteCode: options.inviteCode,
      jwt: this.jwt,
    }).then((result) => {
      this.addRole(result.result.role);
    });
  }

  // TODO: clarify differences between getRoleInCommunity, getRoleOfCommunity, isRoleOfCommunity, getAllRolesInCommunity

  /**
   * Retrieves the role of a specific account in the active roles set
   * @param account An arbitrary Commonwealth account
   * @param options A chain or a community ID
   */
  public getRoleInCommunity(options: { account?: Account<any>, chain?: string, community?: string }): RoleInfo {
    const account = options.account || this.activeAccount;
    if (!account) return;

    const address_id = this.addresses.find((a) => {
      return a.address === account.address && a.chain === account.chain.id;
    })?.id;

    return this.roles.find((r) => {
      console.log('r');
      console.log(r);
      console.log('r.address_id');
      console.log(r.address_id);
      const addressMatches = r.address_id === address_id;
      const communityMatches = options.chain
        ? r.chain_id === options.chain
        : r.offchain_community_id === options.community;
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
      const ofCommunity = (options.chain) ? (r.chain_id === options.chain) : (r.offchain_community_id === options.community);
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
  public getAllRolesInCommunity(options: { chain?: string, community?: string }) {
    return this.roles.filter((r) => {
      return options.chain
        ? r.chain_id === options.chain
        : r.offchain_community_id === options.community;
    });
  }

  /**
   * Grabs all corresponding addresses from the set
   * of active roles for a given chain/community.
   * @param options A chain or a community ID
   */
  getAddressIdsFromRoles(options: { chain: string; community: string; }): Number[] {
    return (options.chain)
      ? this.roles
        .filter((role) => role.chain_id === options.chain)
        .map((role) => role.address_id)
      : this.roles
        .filter((role) => role.offchain_community_id === options.community)
        .map((role) => role.address_id);
  }

  /**
   * Grabs all joinable addresses for a potential chain/community
   * @param options A chain or a community ID
   */
  getJoinableAddresses(options: { chain?: string, community?: string }): AddressInfo[] {
    return (options.chain)
      ? this.addresses.filter((a) => a.chain === options.chain)
      : this.addresses;
  }

  public getCommunitiesOfRoles(): string[] {
    return this.roles
      .filter((role) => role.offchain_community_id)
      .map((r) => r.offchain_community_id);
  }

  public getChainsOfRoles(): string[] {
    return this.roles
      .filter((role) => !role.offchain_community_id)
      .map((r) => r.chain_id);
  }

  public getActiveAccountsByRole(): [Account<any>, RoleInfo][] {
    return this.activeAccounts.map((account) => {
      const role = this.getRoleInCommunity({
        account,
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      });
      return [account, role];
    });
  }

  /**
   * Given a chain/community ID, determines if the
   * active account is an admin of the specified community.
   * @param options A chain or a community ID
   */
  public isAdminOfEntity(options: { chain?: string, community?: string }): boolean {
    if (!this.activeAccount) return false;
    const adminRole = this.roles.find((role) => {
      return role.address === this.activeAccount.address
        && role.permission === RolePermission.admin
        && ((options.community && role.offchain_community_id === options.community)
            || (options.chain && role.chain_id === options.chain));
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
    account: AddressInfo | Account<any> | undefined,
    chain?: string,
    community?: string
  }): boolean {
    const addressinfo: AddressInfo | undefined = (options.account instanceof Account)
      ? this.addresses.find((a) => (
        options.account.address === a.address
          && (options.account.chain as ChainInfo).id === a.chain
      ))
      : options.account;
    const roles = this.roles.filter((role) => addressinfo
      ? role.address_id === addressinfo.id
      : true);
    if (options.chain) {
      return roles.map((r) => r.chain_id).indexOf(options.chain) !== -1;
    } else if (options.community) {
      return roles.map((r) => r.offchain_community_id).indexOf(options.community) !== -1;
    } else {
      return false;
    }
  }
}
