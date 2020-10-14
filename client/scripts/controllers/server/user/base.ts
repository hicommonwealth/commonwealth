import $ from 'jquery';
import app from 'state';

import {
  NodeInfo,
  AddressInfo,
  RoleInfo,
  SocialAccount,
  Account,
  StarredCommunity,
} from 'models';

import NotificationsController from '../notifications';
import DraftsController from '../drafts';

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

  private _emailVerified: boolean;
  public get emailVerified(): boolean { return this._emailVerified; }
  private _setEmailVerified(emailVerified: boolean): void { this._emailVerified = emailVerified; }

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

  private _discussionDrafts: DraftsController = new DraftsController();
  public get discussionDrafts(): DraftsController { return this._discussionDrafts; }
  private _setDiscussionDrafts(drafts: DraftsController): void { this._discussionDrafts = drafts; }

  private _unseenPosts: object;
  public get unseenPosts(): object { return this._unseenPosts; }
  private _setUnseenPosts(unseenPosts: object): void { this._unseenPosts = unseenPosts; }

  constructor() {}

  // Recommend using the setActiveAccount helper in controllers/app/login.ts to persist the setting to the backend.
  public ephemerallySetActiveAccount(account: Account<any>): void { this._setActiveAccount(account); }
  public setEmail(email: string): void { this._setEmail(email); }
  public setEmailInterval(emailInterval: string): void { this._setEmailInterval(emailInterval); }
  public setEmailVerified(verified: boolean): void { this._setEmailVerified(verified); }
  public setJWT(JWT: string): void { this._setJWT(JWT); }

  public setRoles(roles = []): void {
    roles.forEach((role) => {
      role.address = role.Address.address;
      role.address_chain = role.Address.chain;
      delete role.Address;
      this._roles.push(role);
    });
  }
  public addRole(role: RoleInfo): void {
    this._roles.push(role);
  }
  public removeRole(predicate: (r) => boolean): void {
    const index = this.roles.findIndex(predicate);
    if (index !== -1) this._roles.splice(index, 1);
  }

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
        const node = app.config.nodes.getAll().find((n) => n.url === options.url && n.chain.id === options.chain);
        if (!node) throw new Error('unexpected node');
        this.setSelectedNode(node);
      }
    }).catch((e) => console.error('Failed to select node on server'));
  }

  public setSiteAdmin(isAdmin: boolean): void { this._setSiteAdmin(isAdmin); }
  public setDisableRichText(disableRichText: boolean): void { this._setDisableRichText(disableRichText); }
  public setNotifications(notifications: NotificationsController): void { this._setNotifications(notifications); }
  public setDiscussionDrafts(drafts: DraftsController): void { this.setDiscussionDrafts(drafts); }
  public setLastVisited(lastVisited: object): void { this._setLastVisited(lastVisited); }

  public setStarredCommunities(star: StarredCommunity[]): void { this._setStarredCommunities(star); }
  public addStarredCommunity(star: StarredCommunity): void { this._starredCommunities.push(star); }
  public removeStarredCommunity(star: StarredCommunity): void {
    const index = this._starredCommunities.findIndex((s) => (
      s.chain
        ? (s.user_id === star.user_id && s.chain === star.chain)
        : (s.user_id === star.user_id && s.community === star.community)
    ));
    this._starredCommunities.splice(index, 1);
  }


  public setUnseenPosts(unseenPosts: object): void { this._setUnseenPosts(unseenPosts); }
}
