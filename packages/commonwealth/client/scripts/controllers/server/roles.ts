import { AccessLevel } from '@hicommonwealth/shared';
import app from 'state';
import { userStore } from 'state/ui/user';
import Permissions from 'utils/Permissions';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import RoleInfo from '../../models/RoleInfo';
import type { UserController } from './user';

export class RolesController {
  constructor(public readonly User: UserController) {}

  private _roles: RoleInfo[] = [];
  public get roles(): RoleInfo[] {
    return this._roles;
  }

  public setRoles(roles = []): void {
    const roleIds = this.roles.map((r) => r.id);
    roles.forEach((role) => {
      // @ts-expect-error StrictNullChecks
      if (!roleIds.includes(role.id)) {
        // @ts-expect-error StrictNullChecks
        role.address = role.Address.address;
        // @ts-expect-error StrictNullChecks
        role.address_chain = role.Address.community_id;
        // @ts-expect-error StrictNullChecks
        role.last_active = role.Address.last_active;
        // @ts-expect-error StrictNullChecks
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
    options.address &&
      options.address.address &&
      this.addRole({
        address: options.address.address,
        address_chain: options.community!,
        address_id: options.address.addressId!,
        allow: 0,
        community_id: options.community!,
        deny: 0,
        is_user_default: true,
        permission: AccessLevel.Member,
      });
  }

  public deleteRole(options: { address: AddressInfo; community: string }): any {
    this.removeRole((r) => {
      return (
        r.chain_id === options.community &&
        r.address_id === options.address.addressId
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
    const account = options.account || userStore.getState().activeAccount;
    // @ts-expect-error StrictNullChecks
    if (!account) return;

    const address_id = userStore.getState().addresses.find((a) => {
      return (
        a.address === account.address && a.community.id === account.community.id
      );
    })?.addressId;

    // @ts-expect-error StrictNullChecks
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
      !userStore.getState().activeAccount ||
      !app.isLoggedIn() ||
      userStore.getState().addresses.length === 0 ||
      this.roles.length === 0
    )
      // @ts-expect-error StrictNullChecks
      return;
    // @ts-expect-error StrictNullChecks
    return this.roles.find((r) => {
      const permission = r.permission === options.role;
      const referencedAddress = userStore
        .getState()
        .addresses.find((address) => address.addressId === r.address_id);
      if (!referencedAddress) return;
      const isSame =
        userStore.getState().activeAccount?.address ===
        referencedAddress.address;
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
   * Given a community ID, determines if the
   * active account is an admin of the specified community.
   * @param options A community or a community ID
   */
  public isAdminOfEntity(options: { community?: string }): boolean {
    if (!userStore.getState().activeAccount) return false;
    if (Permissions.isSiteAdmin()) return true;

    const adminRole = this.roles.find((role) => {
      return (
        role.address === userStore.getState().activeAccount?.address &&
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
        ? userStore.getState().addresses.find(
            (a) =>
              // @ts-expect-error StrictNullChecks
              options.account.address === a.address &&
              // @ts-expect-error StrictNullChecks
              options.account.community.id === a.community.id,
          )
        : options.account;
    const roles = this.roles.filter((role) =>
      addressinfo ? role.address_id === addressinfo.addressId : true,
    );
    if (options.community) {
      return roles.map((r) => r.community_id).indexOf(options.community) !== -1;
    } else {
      return false;
    }
  }
}
