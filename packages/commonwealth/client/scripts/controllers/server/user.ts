/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-imports */
import $ from 'jquery';

import type { ChainInfo, SocialAccount, StarredCommunity } from 'models';
import app from 'state';
import { notifyError } from '../app/notifications';
import DraftsController from './drafts';

// eslint-disable-next-line
import NotificationsController from './notifications';
import type { AddressAccount } from 'models';

export class UserController {
  private _activeAddressAccount: AddressAccount;
  public get activeAddressAccount(): AddressAccount {
    return this._activeAddressAccount;
  }

  private _setActiveAddressAccount(addressAccount: AddressAccount): void {
    this._activeAddressAccount = addressAccount;
  }

  private _email: string;
  public get email(): string {
    return this._email;
  }

  private _setEmail(email: string): void {
    this._email = email;
  }

  private _emailInterval: string;
  public get emailInterval(): string {
    return this._emailInterval;
  }

  private _setEmailInterval(emailInterval: string): void {
    this._emailInterval = emailInterval;
  }

  private _emailVerified: boolean;
  public get emailVerified(): boolean {
    return this._emailVerified;
  }

  private _setEmailVerified(emailVerified: boolean): void {
    this._emailVerified = emailVerified;
  }

  private _jwt: string;
  public get jwt(): string {
    return this._jwt;
  }

  private _setJWT(JWT: string): void {
    this._jwt = JWT;
  }

  private _addresses: AddressAccount[] = [];
  public get addresses(): AddressAccount[] {
    return this._addresses;
  }

  private _setAddresses(addresses: AddressAccount[]): void {
    this._addresses = addresses;
  }

  private _activeAccounts: AddressAccount[] = [];
  public get activeAccounts(): AddressAccount[] {
    return this._activeAccounts;
  }

  private _setActiveAccounts(activeAccounts: AddressAccount[]): void {
    this._activeAccounts = activeAccounts;
  }

  private _socialAccounts: SocialAccount[] = [];
  public get socialAccounts(): SocialAccount[] {
    return this._socialAccounts;
  }

  private _setSocialAccounts(socialAccounts: SocialAccount[]): void {
    this._socialAccounts = socialAccounts;
  }

  private _selectedChain: ChainInfo;
  public get selectedChain(): ChainInfo {
    return this._selectedChain;
  }

  private _setSelectedChain(selectedChain: ChainInfo): void {
    this._selectedChain = selectedChain;
  }

  private _isSiteAdmin: boolean;
  public get isSiteAdmin(): boolean {
    return this._isSiteAdmin;
  }

  private _setSiteAdmin(isAdmin: boolean): void {
    this._isSiteAdmin = isAdmin;
  }

  private _disableRichText: boolean;
  public get disableRichText(): boolean {
    return this._disableRichText;
  }

  private _setDisableRichText(disableRichText: boolean): void {
    this._disableRichText = disableRichText;
  }

  // Likely remove when unified profiles are in
  private _hasDisplayName: boolean;
  public setHasDisplayName(hasDisplayName: boolean): void {
    this._hasDisplayName = hasDisplayName;
  }
  public get hasDisplayName(): boolean {
    return this._hasDisplayName;
  }

  private _notifications: NotificationsController =
    new NotificationsController();
  public get notifications(): NotificationsController {
    return this._notifications;
  }

  private _setNotifications(notifications: NotificationsController): void {
    this._notifications = notifications;
  }

  private _lastVisited: object;
  public get lastVisited(): object {
    return this._lastVisited;
  }

  private _setLastVisited(lastVisited: object): void {
    this._lastVisited = lastVisited;
  }

  private _starredCommunities: StarredCommunity[];
  public get starredCommunities(): StarredCommunity[] {
    return this._starredCommunities;
  }

  private _setStarredCommunities(starredCommunities: StarredCommunity[]): void {
    this._starredCommunities = starredCommunities;
  }

  private _discussionDrafts: DraftsController = new DraftsController();
  public get discussionDrafts(): DraftsController {
    return this._discussionDrafts;
  }

  private _setDiscussionDrafts(drafts: DraftsController): void {
    this._discussionDrafts = drafts;
  }

  private _unseenPosts: object;
  public get unseenPosts(): object {
    return this._unseenPosts;
  }

  private _setUnseenPosts(unseenPosts: object): void {
    this._unseenPosts = unseenPosts;
  }

  constructor() {}

  // Recommend using the setActiveAccount helper in controllers/app/login.ts to persist the setting to the backend.
  public ephemerallySetActiveAccount(account: AddressAccount): void {
    this._setActiveAddressAccount(account);
  }

  public setEmail(email: string): void {
    this._setEmail(email);
  }

  public updateEmail(email: string): void {
    this._setEmail(email);

    try {
      $.post(`${app.serverUrl()}/updateEmail`, {
        email: email,
        jwt: app.user.jwt,
      });
    } catch (e) {
      console.log(e);
      notifyError('Unable to update email');
    }
  }

  public setEmailInterval(emailInterval: string): void {
    this._setEmailInterval(emailInterval);
    try {
      $.post(`${app.serverUrl()}/writeUserSetting`, {
        jwt: app.user.jwt,
        key: 'updateEmailInterval',
        value: emailInterval,
      });
    } catch (e) {
      console.log(e);
      notifyError('Unable to set email interval');
    }
  }

  public setEmailVerified(verified: boolean): void {
    this._setEmailVerified(verified);
  }

  public setJWT(JWT: string): void {
    this._setJWT(JWT);
  }

  public setAddresses(addresses: AddressAccount[]): void {
    this._setAddresses(addresses);
  }

  public addAddress(address: AddressAccount): void {
    this._addresses.push(address);
  }

  public removeAddress(address: AddressAccount): void {
    this._addresses.splice(
      this._addresses.findIndex((a) => a.address === address.address),
      1
    );
  }

  public setActiveAccounts(activeAccounts: AddressAccount[]): void {
    this._setActiveAccounts(activeAccounts);
  }

  public addActiveAddress(address: AddressAccount): void {
    this._activeAccounts.push(address);
  }

  public removeActiveAddress(address: AddressAccount): void {
    this._activeAccounts.splice(
      this._activeAccounts.findIndex((a) => a.address === address.address),
      1
    );
  }

  public setSocialAccounts(socialAccounts: SocialAccount[]): void {
    this._setSocialAccounts(socialAccounts);
  }

  public addSocialAccount(social: SocialAccount): void {
    this._socialAccounts.push(social);
  }

  public removeSocialAccount(social: SocialAccount): void {
    this._socialAccounts.splice(
      this._socialAccounts.findIndex((s) => s.username === social.username),
      1
    );
  }

  public setSelectedChain(selectedChain: ChainInfo): void {
    this._setSelectedChain(selectedChain);
  }

  public selectChain(options: { chain: string }): JQueryPromise<void> {
    return $.post(`${app.serverUrl()}/selectChain`, {
      chain: options.chain,
      auth: true,
      jwt: this._jwt,
    })
      .then((res) => {
        if (res.status !== 'Success') {
          throw new Error(`got unsuccessful status: ${res.status}`);
        } else {
          const chain = app.config.chains.getById(options.chain);
          if (!chain) throw new Error('unexpected chain');
          this.setSelectedChain(chain);
        }
      })
      .catch(() => console.error('Failed to select node on server'));
  }

  public setSiteAdmin(isAdmin: boolean): void {
    this._setSiteAdmin(isAdmin);
  }

  public setDisableRichText(disableRichText: boolean): void {
    this._setDisableRichText(disableRichText);
  }

  public setNotifications(notifications: NotificationsController): void {
    this._setNotifications(notifications);
  }

  public setDiscussionDrafts(drafts: DraftsController): void {
    this.setDiscussionDrafts(drafts);
  }

  public setLastVisited(lastVisited: object): void {
    this._setLastVisited(lastVisited);
  }

  public setStarredCommunities(star: StarredCommunity[]): void {
    this._setStarredCommunities(star);
  }

  public addStarredCommunity(star: StarredCommunity): void {
    this._starredCommunities.push(star);
  }

  public removeStarredCommunity(star: StarredCommunity): void {
    const index = this._starredCommunities.findIndex(
      (s) => s.user_id === star.user_id && s.chain === star.chain
    );
    this._starredCommunities.splice(index, 1);
  }

  public setUnseenPosts(unseenPosts: object): void {
    this._setUnseenPosts(unseenPosts);
  }
}
