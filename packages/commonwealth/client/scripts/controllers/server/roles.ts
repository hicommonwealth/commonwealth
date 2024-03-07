import { AccessLevel } from '@hicommonwealth/core';
import app from 'state';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import RoleInfo from '../../models/RoleInfo';
import type { UserController } from './user';

const getPermissionLevel = (permission: AccessLevel | undefined) => {
  if (permission === undefined) {
    return AccessLevel.Everyone;
  }
  return permission;
};

export class RolesController {
  constructor(public readonly User: UserController) {}

  private _roles: RoleInfo[] = [];
  public get roles(): RoleInfo[] {
    return this._roles;
  }

  public setRoles(roles = []): void {
    const roleIds = this.roles.map((r) => r.id);
    roles.forEach((role) => {
      if (!roleIds.includes(role.id)) {
        role.address = role.Address.address;
        role.address_chain = role.Address.community_id;
        role.last_active = role.Address.last_active;
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
    address: AddressInfo | Omit<AddressInfo, 'community'>;
    community?: string;
  }): any {
    this.addRole({
      address: options.address.address,
      address_chain: options.community,
      address_id: options.address.id,
      allow: 0,
      chain_id: options.community,
      community_role_id: options.address.id,
      deny: 0,
      is_user_default: true,
      permission: AccessLevel.Member,
    } as any);
  }

  public deleteRole(options: { address: AddressInfo; community: string }): any {
    this.removeRole((r) => {
      return (
        r.chain_id === options.community && r.address_id === options.address.id
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
    community?: string;
  }): RoleInfo {
    const account = options.account || this.User.activeAccount;
    if (!account) return;

    const address_id = this.User.addresses.find((a) => {
      return (
        a.address === account.address && a.community.id === account.community.id
      );
    })?.id;

    return this.roles.find((r) => {
      const addressMatches = r.address_id === address_id;
      const communityMatches = r.community_id === options.community;
      return addressMatches && communityMatches;
    });
  }

  /**
   * Retrieves the role record if one exists for the active user
   * @param role Either 'admin', 'moderator', or 'member'
   * @param options A community ID
   */
  private _getRoleOfCommunity(options: {
    role: string;
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
        (address) => address.id === r.address_id,
      );
      if (!referencedAddress) return;
      const isSame =
        this.User.activeAccount.address === referencedAddress.address;
      const ofCommunity = r.community_id === options.community;
      return permission && referencedAddress && isSame && ofCommunity;
    });
  }

  /**
   * Asserts whether the active roles contains a role for a given community
   * @param role Either 'admin', 'moderator', or 'member'
   * @param options A community ID
   */
  public isRoleOfCommunity(options: {
    role: string;
    community?: string;
  }): boolean {
    return !!this._getRoleOfCommunity(options);
  }

  /**
   * Filters all active roles by a specific commnity
   * @param options A community ID
   */
  public getAllRolesInCommunity(options: { community?: string }) {
    return this.roles.filter((r) => {
      return r.community_id === options.community;
    });
  }

  /**
   * Grabs all joinable addresses for a potential community
   * @param options A community ID
   */
  public getJoinableAddresses(options: { community?: string }): AddressInfo[] {
    return options.community
      ? this.User.addresses.filter((a) => a.community.id === options.community)
      : this.User.addresses;
  }

  public getActiveAccountsByRole(): [Account, RoleInfo][] {
    const activeAccountsByRole = this.User.activeAccounts.map((account) => {
      const role = this.getRoleInCommunity({
        account,
        community: app.activeChainId(),
      });
      return [account, role];
    });
    const filteredActiveAccountsByRole = activeAccountsByRole.reduce(
      (arr: [Account, RoleInfo][], current: [Account, RoleInfo]) => {
        const index = arr.findIndex(
          (item) => item[0].address === current[0].address,
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
      [],
    );

    return filteredActiveAccountsByRole;
  }

  /**
   * Given a community ID, determines if the
   * active account is an admin of the specified community.
   * @param options A community or a community ID
   */
  public isAdminOfEntity(options: { community?: string }): boolean {
    if (!this.User.activeAccount) return false;
    if (app.user.isSiteAdmin) return true;

    const adminRole = this.roles.find((role) => {
      return (
        role.address === this.User.activeAccount.address &&
        role.permission === AccessLevel.Admin &&
        options.community &&
        role.community_id === options.community
      );
    });

    return !!adminRole;
  }

  /**
   * Checks membership in a community
   * @param address Address being checked for membership
   * @param options A community ID
   * TODO: Should we default to this.activeAccount if address is null?
   */
  public isMember(options: {
    account: AddressInfo | Account | undefined;
    community?: string;
  }): boolean {
    const addressinfo: AddressInfo | undefined =
      options.account instanceof Account
        ? this.User.addresses.find(
            (a) =>
              options.account.address === a.address &&
              options.account.community.id === a.community.id,
          )
        : options.account;
    const roles = this.roles.filter((role) =>
      addressinfo ? role.address_id === addressinfo.id : true,
    );
    if (options.community) {
      return roles.map((r) => r.community_id).indexOf(options.community) !== -1;
    } else {
      return false;
    }
  }

  public getDefaultAddressInCommunity(options: { community?: string }) {
    const role = this.roles.find((r) => {
      const communityMatches = r.community_id === options.community;
      return communityMatches && r.is_user_default;
    });

    if (!role) return;
    return this.User.addresses.find((a) => a.id === role.address_id);
  }
}
