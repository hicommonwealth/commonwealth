import $ from 'jquery';
import app from 'state';

import { ChainStore, OffchainCommunitiesStore, NodeStore } from 'stores';
import {
  NodeInfo,
  AddressInfo,
  RoleInfo,
  SocialAccount,
  OffchainTag,
  ContractCategory,
  Account,
  IChainAdapter,
  ICommunityAdapter,
  NotificationCategory,
  RolePermission,
  StarredCommunity,
  ChainInfo,
} from 'models';

import NotificationsController from './notifications';

export default class {
  private _activeAccount: Account<any>;
  public get activeAccount(): Account<any> { return this._activeAccount; }
  private _setActiveAccount(account: Account<any>): void { this._activeAccount = account; }

  private _email: string;
  public get email(): string { return this._email; }
  private _setEmail(email: string): void { this._email = email; }

  private _emailInterval: string;
  public get emailInterval(): string { return this._emailInterval; }
  private _setEmailInterval(emailInterval: string): void { this._emailInterval = emailInterval; }

  private _jwt: string;
  public get jwt(): string { return this._jwt; }
  private _setJWT(JWT: string): void { this._jwt = JWT; }

  private _roles: RoleInfo[] = [];
  public get roles(): RoleInfo[] { return this._roles; }
  private _setRoles(roles: RoleInfo[]): void { this._roles = roles; }

  private _addresses: AddressInfo[] = [];
  public get addresses(): AddressInfo[] { return this._addresses; }
  private _setAddresses(addresses: AddressInfo[]): void { this._addresses = addresses; }

  private _activeAccounts: Account<any>[] = [];
  public get activeAccounts(): Account<any>[] { return this._activeAccounts; }
  private _setActiveAccounts(activeAccounts: Account<any>[]): void { this._activeAccounts = activeAccounts; }

  private _socialAccounts: SocialAccount[] = [];
  public get socialAccounts(): SocialAccount[] { return this._socialAccounts; }
  private _setSocialAccounts(socialAccounts: SocialAccount[]): void { this._socialAccounts = socialAccounts; }

  private _selectedNode: NodeInfo;
  public get selectedNode(): NodeInfo { return this._selectedNode; }
  private _setSelectedNode(selectedNode: NodeInfo): void { this._selectedNode = selectedNode; }

  private _isSiteAdmin: boolean;
  public get isSiteAdmin(): boolean { return this._isSiteAdmin; }
  private _setSiteAdmin(isAdmin: boolean): void { this._isSiteAdmin = isAdmin; }

  private _disableRichText: boolean;
  public get disableRichText(): boolean { return this._disableRichText; }
  private _setDisableRichText(disableRichText: boolean): void { this._disableRichText = disableRichText; }

  private _notifications: NotificationsController = new NotificationsController();
  public get notifications(): NotificationsController { return this._notifications; }
  private _setNotifications(notifications: NotificationsController): void { this._notifications = notifications; }

  private _lastVisited: object;
  public get lastVisited(): object { return this._lastVisited; }
  private _setLastVisited(lastVisited: object): void { this._lastVisited = lastVisited; }

  private _starredCommunities: StarredCommunity[];
  public get starredCommunities(): StarredCommunity[] { return this._starredCommunities; }
  private _setStarredCommunities(starredCommunities: StarredCommunity[]): void {
    this._starredCommunities = starredCommunities;
  }

  private _unseenPosts: object;
  public get unseenPosts(): object { return this._unseenPosts; }
  private _setUnseenPosts(unseenPosts: object): void { this._unseenPosts = unseenPosts; }

  constructor() {}

  public setActiveAccount(account: Account<any>): void { this._setActiveAccount(account); }
  public setEmail(email: string): void { this._setEmail(email); }
  public setEmailInterval(emailInterval: string): void { this._setEmailInterval(emailInterval); }
  public setJWT(JWT: string): void { this._setJWT(JWT); }

  public setAddresses(addresses: AddressInfo[]): void { this._setAddresses(addresses); }
  public addAddress(address: AddressInfo): void { this._addresses.push(address); }
  public removeAddress(address: AddressInfo): void {
    this._addresses.splice(this._addresses.findIndex((a) => a.address === address.address), 1);
  }

  public setActiveAccounts(activeAccounts: Account<any>[]): void { this._setActiveAccounts(activeAccounts); }
  public addActiveAddress(address: Account<any>): void { this._activeAccounts.push(address); }
  public removeActiveAddress(address: Account<any>): void {
    this._activeAccounts.splice(this._activeAccounts.findIndex((a) => a.address === address.address), 1);
  }

  public setSocialAccounts(socialAccounts: SocialAccount[]): void { this._setSocialAccounts(socialAccounts); }
  public addSocialAccount(social: SocialAccount): void { this._socialAccounts.push(social); }
  public removeSocialAccount(social: SocialAccount): void {
    this._socialAccounts.splice(this._socialAccounts.findIndex((s) => s.username === social.username), 1);
  }

  public setSelectedNode(selectedNode: NodeInfo): void { this._setSelectedNode(selectedNode); }
  public selectNode(options: { url: string, chain: string }): JQueryPromise<void> {
    return $.post(`${app.serverUrl()}/selectNode`, {
      url: options.url,
      chain: options.chain,
      auth: true,
      jwt: this._jwt,
    }).then((res) => {
      if (res.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${res.status}`);
      } else {
        // TODO: Ensure setSelectedNode is called with the right arg
        this.setSelectedNode(NodeInfo.fromJSON(res.result));
      }
    }).catch((e) => console.error('Failed to select node on server'));
  }

  public setSiteAdmin(isAdmin: boolean): void { this._setSiteAdmin(isAdmin); }
  public setDisableRichText(disableRichText: boolean): void { this._setDisableRichText(disableRichText); }
  public setNotifications(notifications: NotificationsController): void { this._setNotifications(notifications); }
  public setLastVisited(lastVisited: object): void { this._setLastVisited(lastVisited); }

  public setStarredCommunities(star: StarredCommunity[]): void { this._setStarredCommunities(star); }
  public addStarredCommunity(star: StarredCommunity): void { this._starredCommunities.push(star); }
  public removeStarredCommunity(star: StarredCommunity): void {
    this._starredCommunities.splice(this._starredCommunities.findIndex((s) => (
      s.user_id === star.user_id
      && s.chain === star.chain
      && s.community === star.community
    ), 1));
  }


  public setUnseenPosts(unseenPosts: object): void { this._setUnseenPosts(unseenPosts); }

  /*
    Address logic
  */

  public getDefaultAddressInCommunity(options: { chain?: string, community?: string }) {
    const role = this._roles.find((r) => {
      const communityMatches = options.chain
        ? r.chain_id === options.chain
        : r.offchain_community_id === options.community;
      return communityMatches && r.is_user_default;
    });

    if (!role) return;
    return this._addresses.find((a) => a.id === role.address_id);
  }

  /*
    Roles logic
  */

  public getChainRoles(): RoleInfo[] {
    return this._roles.filter((role) => !role.offchain_community_id);
  }

  public getCommunityRoles(): RoleInfo[] {
    return this._roles.filter((role) => role.offchain_community_id);
  }

  public setRoles(roles: RoleInfo[] = []): void {
    roles.forEach((role) => {
      this._roles.push(role);
    });
  }

  public createRole(options: { address: AddressInfo, chain?: string, community?: string }): JQueryPromise<void> {
    // TODO: Change to POST /role
    return $.post('/api/createRole', {
      jwt: this.jwt,
      address_id: options.address.id,
      ...options,
    }).then((result) => {
      // handle state updates
      this._roles.push(result.result);
    });
  }

  public deleteRole(options: { address: AddressInfo, chain?: string, community?: string }): JQueryPromise<void> {
    // TODO: Change to DELETE /role
    return $.post('/api/deleteRole', {
      jwt: this._jwt,
      address_id: options.address.id,
      ...options,
    }).then((result) => {
      // handle state updates
      const index = options.chain
        ? this._roles.findIndex((r) => (
          r.chain_id === options.chain
            && r.address_id === options.address.id
        ))
        : this._roles.findIndex((r) => (
          r.offchain_community_id === options.community
            && r.address_id === options.address.id
        ));
      if (index !== -1) this._roles.splice(index, 1);
    });
  }

  public acceptInvite(options: { address: string, inviteCode: any, reject?: boolean }): JQueryPromise<void> {
    return $.post(`${app.serverUrl()}/acceptInvite`, {
      address: options.address,
      reject: (options.reject) ? options.reject : false,
      inviteCode: options.inviteCode,
      jwt: this._jwt,
    }).then((result) => {
      this._roles.push(result.result.role);
    });
  }

  /**
   * Retrieves the role of a specific account in the active roles set
   * @param account An arbitrary Commonwealth account
   * @param options A chain or a community ID
   */
  public getRoleInCommunity(options: { account: Account<any>, chain?: string, community?: string }) {
    const address_id = this._addresses.find((a) => {
      return a.address === options.account.address && a.chain === options.account.chain.id;
    })?.id;

    return this._roles.find((r) => {
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
    if (!this._activeAccount || !app.isLoggedIn() || this._addresses.length === 0 || this._roles.length === 0) return;
    return this._roles.find((r) => {
      const permission = (r.permission === options.role);
      const referencedAddress = this._addresses.find((address) => address.id === r.address_id);
      const isSame = this._activeAccount.address === referencedAddress.address;
      const ofCommunity = (r.chain_id === options.chain) || (r.offchain_community_id === options.community);
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
    return this._roles.filter((r) => {
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
      ? this._roles
        .filter((role) => role.chain_id === options.chain)
        .map((role) => role.address_id)
      : this._roles
        .filter((role) => role.offchain_community_id === options.community)
        .map((role) => role.address_id);
  }

  /**
   * Grabs all joinable addresses for a potential chain/community
   * @param options A chain or a community ID
   */
  getJoinableAddresses(options: { chain?: string, community?: string }): AddressInfo[] {
    return (options.chain)
      ? this._addresses.filter((a) => a.chain === options.chain)
      : this._addresses;
  }

  public getCommunitiesOfRoles(): string[] {
    return this._roles
      .filter((role) => role.offchain_community_id)
      .map((r) => r.offchain_community_id);
  }

  public getChainsOfRoles(): string[] {
    return this._roles
      .filter((role) => !role.offchain_community_id)
      .map((r) => r.chain_id);
  }

  /**
   * Given a chain/community ID, grabs the first admin role
   * @param options A chain or a community ID
   */
  public getAdmin(options: { chain?: string, community?: string }): RoleInfo {
    return this._roles.find((role) => {
      return role.permission === RolePermission.admin && (
        (role.offchain_community_id === options.community) || (role.chain_id === options.chain)
      );
    });
  }

  /**
   * Given a chain/community ID, determines if the
   * active user is an admin of the specified community.
   * @param options A chain or a community ID
   */
  public isAdminOfEntity(options: { chain?: string, community?: string }): boolean {
    const adminRole = this._roles.find((role) => {
      return role.permission === RolePermission.admin && (
        (role.offchain_community_id === options.community) || (role.chain_id === options.chain)
      );
    });

    return !!adminRole;
  }

  /**
   * Checks if any active roles are admins or moderators of a specifiedd chain/community
   * @param options A chain or a community ID
   */
  public isAdminOrModOfEntity(options: { chain?: string, community?: string }): boolean {
    const roleChecker = (r) => (r.permission === RolePermission.admin || r.permission === RolePermission.moderator);
    this._roles.forEach((r) => {
      if (options.chain) {
        if (r.chain_id === options.chain && roleChecker(r)) {
          return true;
        }
      } else if (options.community) {
        if (r.offchain_community_id === options.community && roleChecker(r)) {
          return true;
        }
      }
    });

    return false;
  }

  // TODO: Should we use active account instead of passing one in?
  public isAdminOrMod(options: { account: Account<any> | AddressInfo | string }): boolean {
    if (!options.account) return false;
    return this._roles.findIndex((r) => {
      if (typeof options.account === 'string') {
        return r.address === options.account && r.permission !== RolePermission.member;
      } else {
        return r.address === options.account.address && r.permission !== RolePermission.member;
      }
    }) !== -1;
  }

  // TODO: Should we use active account instead of passing on in?
  public isAdminOrModOfChain(options: { account: Account<any> | AddressInfo, chain: string }): boolean {
    if (!options.account) return false;
    return this._roles.findIndex((r) => {
      return r.address === options.account.address
        && r.permission !== RolePermission.member
        && r.address_chain === options.account.chain;
    }) !== -1;
  }

  // TODO: Should this use active chain/community?
  public isAdmin(options: { account: Account<any> | AddressInfo | string }): boolean {
    if (!options.account) return false;
    return this._roles.findIndex((r) => {
      if (typeof options.account === 'string') {
        return r.address === options.account && r.permission === RolePermission.admin;
      } else {
        return r.address === options.account.address && r.permission === RolePermission.admin;
      }
    }) !== -1;
  }

  /**
   * Given an arbitrary list of roles, determines if any of
   * the current user's roles coincide with one that is passed in.
   * @param adminsOrMods A list of admins and mods of an arbitrary chain/community
   */
  public isAdminOrModFromList(adminsOrMods: RoleInfo[]): boolean {
    adminsOrMods.forEach((r) => {
      this._roles.forEach((rr) => {
        if (r.address === rr.address) {
          return true;
        }
      });
    });

    return false;
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
      ? this._addresses.find((a) => (
        options.account.address === a.address
          && (options.account.chain as ChainInfo).id === a.chain
      ))
      : options.account;
    const roles = this._roles.filter((role) => addressinfo
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
