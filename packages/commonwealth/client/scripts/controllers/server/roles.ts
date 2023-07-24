import $ from 'jquery';
import app from 'state';

import { AccessLevel } from 'permissions';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import ChainInfo from '../../models/ChainInfo';
import RoleInfo from '../../models/RoleInfo';
import type { UserController } from './user';

const getPermissionLevel = (permission: AccessLevel | undefined) => {
  if (permission === undefined) {
    return AccessLevel.Everyone;
  }
  return permission;
};

export class RolesController {
  constructor(public readonly User: UserController) { }

  private _roles: RoleInfo[] = [];
  public get roles(): RoleInfo[] {
    return this._roles;
  }

  public setRoles(roles = []): void {
    const roleIds = this.roles.map((r) => r.id);
    roles.forEach((role) => {
      if (!roleIds.includes(role.id)) {
        role.address = role.Address.address;
        role.address_chain = role.Address.chain;
        delete role.Address;
        this._roles.push(role);
      }
    });
  }

  public addRole(role: RoleInfo): void {
    this._roles.push(role);
  }

  public removeRole(predicate: (r) => boolean): void {
    const index = this.roles.findIndex(predicate);
    if (index !== -1) this._roles.splice(index, 1);
  }

  public createRole(options: {
    address: AddressInfo | Omit<AddressInfo, 'chain'>;
    chain?: string;
    community?: string;
  }): any {
    this.addRole({
      address: options.address.address,
      address_chain: options.chain,
      address_id: options.address.id,
      allow: 0,
      chain_id: options.chain,
      community_role_id: options.address.id,
      deny: 0,
      is_user_default: true,
      permission: AccessLevel.Member,
    } as any)
  }

  public deleteRole(options: {
    address: AddressInfo;
    chain: string;
  }): any {
    this.removeRole((r) => {
      return (
        r.chain_id === options.chain && r.address_id === options.address.id
      );
    });
  }

  // TODO: clarify differences between getRoleInCommunity, getRoleOfCommunity, isRoleOfCommunity, getAllRolesInCommunity

  /**
   * Retrieves the role of a specific account in the active roles set
   * @param account An arbitrary Commonwealth account
   * @param options A chain or a community ID
   */
  public getRoleInCommunity(options: {
    account?: Account;
    chain?: string;
  }): RoleInfo {
    const account = options.account || this.User.activeAccount;
    if (!account) return;

    const address_id = this.User.addresses.find((a) => {
      return a.address === account.address && a.chain.id === account.chain.id;
    })?.id;

    return this.roles.find((r) => {
      const addressMatches = r.address_id === address_id;
      const communityMatches = r.chain_id === options.chain;
      return addressMatches && communityMatches;
    });
  }

  /**
   * Retrieves the role record if one exists for the active user
   * @param role Either 'admin', 'moderator', or 'member'
   * @param options A chain or a community ID
   */
  private _getRoleOfCommunity(options: {
    role: string;
    chain?: string;
    community?: string;
  }): RoleInfo {
    if (
      !this.User.activeAccount ||
      !app.isLoggedIn() ||
      this.User.addresses.length === 0 ||
      this.roles.length === 0
    )
      return;
    return this.roles.find((r) => {
      const permission = r.permission === options.role;
      const referencedAddress = this.User.addresses.find(
        (address) => address.id === r.address_id
      );
      if (!referencedAddress) return;
      const isSame =
        this.User.activeAccount.address === referencedAddress.address;
      const ofCommunity = r.chain_id === options.chain;
      return permission && referencedAddress && isSame && ofCommunity;
    });
  }

  /**
   * Asserts whether the active roles contains a role for a given chain/community
   * @param role Either 'admin', 'moderator', or 'member'
   * @param options A chain or a community ID
   */
  public isRoleOfCommunity(options: {
    role: string;
    chain?: string;
    community?: string;
  }): boolean {
    return !!this._getRoleOfCommunity(options);
  }

  /**
   * Filters all active roles by a specific chain/commnity
   * @param options A chain or a community ID
   */
  public getAllRolesInCommunity(options: { chain?: string }) {
    return this.roles.filter((r) => {
      return r.chain_id === options.chain;
    });
  }

  /**
   * Grabs all joinable addresses for a potential chain/community
   * @param options A chain or a community ID
   */
  public getJoinableAddresses(options: {
    chain?: string;
    community?: string;
  }): AddressInfo[] {
    return options.chain
      ? this.User.addresses.filter((a) => a.chain.id === options.chain)
      : this.User.addresses;
  }

  public getActiveAccountsByRole(): [Account, RoleInfo][] {
    const activeAccountsByRole = this.User.activeAccounts.map((account) => {
      const role = this.getRoleInCommunity({
        account,
        chain: app.activeChainId(),
      });
      return [account, role];
    });
    const filteredActiveAccountsByRole = activeAccountsByRole.reduce(
      (arr: [Account, RoleInfo][], current: [Account, RoleInfo]) => {
        const index = arr.findIndex(
          (item) => item[0].address === current[0].address
        );
        if (index < 0) {
          return [...arr, current];
        }
        if (
          getPermissionLevel(arr[index][1]?.permission) <
          getPermissionLevel(current[1]?.permission)
        ) {
          return [...arr.splice(0, index), current, ...arr.splice(index + 1)];
        }
        return arr;
      },
      []
    );

    return filteredActiveAccountsByRole;
  }

  /**
   * Given a chain/community ID, determines if the
   * active account is an admin of the specified community.
   * @param options A chain or a community ID
   */
  public isAdminOfEntity(options: { chain?: string }): boolean {
    if (!this.User.activeAccount) return false;
    if (app.user.isSiteAdmin) return true;

    const adminRole = this.roles.find((role) => {
      return (
        role.address === this.User.activeAccount.address &&
        role.permission === AccessLevel.Admin &&
        options.chain &&
        role.chain_id === options.chain
      );
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
    account: AddressInfo | Account | undefined;
    chain?: string;
    community?: string;
  }): boolean {
    const addressinfo: AddressInfo | undefined =
      options.account instanceof Account
        ? this.User.addresses.find(
          (a) =>
            options.account.address === a.address &&
            (options.account.chain as ChainInfo).id === a.chain.id
        )
        : options.account;
    const roles = this.roles.filter((role) =>
      addressinfo ? role.address_id === addressinfo.id : true
    );
    if (options.chain) {
      return roles.map((r) => r.chain_id).indexOf(options.chain) !== -1;
    } else {
      return false;
    }
  }

  public getDefaultAddressInCommunity(options: {
    chain?: string;
    community?: string;
  }) {
    const role = this.roles.find((r) => {
      const communityMatches = r.chain_id === options.chain;
      return communityMatches && r.is_user_default;
    });

    if (!role) return;
    return this.User.addresses.find((a) => a.id === role.address_id);
  }
}
