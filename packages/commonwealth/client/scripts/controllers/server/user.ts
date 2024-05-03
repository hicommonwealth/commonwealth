/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { EventEmitter } from 'events';

import app from 'state';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import ChainInfo from '../../models/ChainInfo';
import StarredCommunity from '../../models/StarredCommunity';
import { notifyError } from '../app/notifications';

// eslint-disable-next-line
import axios from 'axios';
import NotificationsController from './notifications';

export class UserController {
  private _activeAccount: Account;
  public get activeAccount(): Account {
    return this._activeAccount;
  }

  public isFetched = new EventEmitter();

  private _setActiveAccount(account: Account): void {
    this._activeAccount = account;
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

  private _addresses: AddressInfo[] = [];
  public get addresses(): AddressInfo[] {
    return this._addresses;
  }

  private _setAddresses(addresses: AddressInfo[]): void {
    this._addresses = addresses;
  }

  private _activeAccounts: Account[] = [];
  public get activeAccounts(): Account[] {
    return this._activeAccounts;
  }

  private _setActiveAccounts(
    activeAccounts: Account[],
    shouldRedraw = true,
  ): void {
    this._activeAccounts = activeAccounts;
    if (shouldRedraw) {
      this.isFetched.emit('redraw');
    }
  }

  private _selectedCommunity: ChainInfo;
  public get selectedCommunity(): ChainInfo {
    return this._selectedCommunity;
  }

  private _setSelectedCommunity(selectedCommunity: ChainInfo): void {
    this._selectedCommunity = selectedCommunity;
  }

  private _isSiteAdmin: boolean;
  public get isSiteAdmin(): boolean {
    return this._isSiteAdmin;
  }

  private _setSiteAdmin(isAdmin: boolean): void {
    this._isSiteAdmin = isAdmin;
  }

  private _notifications: NotificationsController =
    new NotificationsController();
  public get notifications(): NotificationsController {
    return this._notifications;
  }

  private _setNotifications(notifications: NotificationsController): void {
    this._notifications = notifications;
  }

  private _starredCommunities: StarredCommunity[];
  public get starredCommunities(): StarredCommunity[] {
    return this._starredCommunities;
  }

  private _setStarredCommunities(starredCommunities: StarredCommunity[]): void {
    this._starredCommunities = starredCommunities;
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
  public ephemerallySetActiveAccount(account: Account): void {
    this._setActiveAccount(account);
    this.isFetched.emit('redraw');
  }

  public setEmail(email: string): void {
    this._setEmail(email);
  }

  public async updateEmail(
    email: string,
    shouldNotifyFailure = true,
  ): Promise<void> {
    this._setEmail(email);

    try {
      await axios.post(`${app.serverUrl()}/updateEmail`, {
        email: email,
        jwt: app.user.jwt,
      });
    } catch (e) {
      console.log(e);
      if (shouldNotifyFailure) {
        notifyError('Unable to update email');
      }
    }
  }

  public setEmailInterval(emailInterval: string): void {
    this._setEmailInterval(emailInterval);
  }

  public async updateEmailInterval(emailInterval: string): Promise<void> {
    try {
      await axios.post(`${app.serverUrl()}/writeUserSetting`, {
        jwt: app.user.jwt,
        key: 'updateEmailInterval',
        value: emailInterval,
      });
      this._setEmailInterval(emailInterval);
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

  public setAddresses(addresses: AddressInfo[]): void {
    this._setAddresses(addresses);
  }

  public addAddress(address: AddressInfo): void {
    this._addresses.push(address);
  }

  public removeAddress(address: AddressInfo): void {
    this._addresses.splice(
      this._addresses.findIndex((a) => a.address === address.address),
      1,
    );
  }

  public setActiveAccounts(
    activeAccounts: Account[],
    shouldRedraw = true,
  ): void {
    this._setActiveAccounts(activeAccounts, shouldRedraw);
  }

  public addActiveAddress(address: Account): void {
    this._activeAccounts.push(address);
  }

  public removeActiveAddress(address: Account): void {
    this._activeAccounts.splice(
      this._activeAccounts.findIndex((a) => a.address === address.address),
      1,
    );
  }

  public setSelectedCommunity(selectedCommunity: ChainInfo): void {
    this._setSelectedCommunity(selectedCommunity);
  }

  public async selectCommunity(options: { community: string }): Promise<void> {
    try {
      const res = await axios.post(`${app.serverUrl()}/selectCommunity`, {
        community_id: options.community,
        auth: true,
        jwt: this._jwt,
      });

      if (res.data.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${res.data.status}`);
      } else {
        const community = app.config.chains.getById(options.community);
        if (!community) {
          throw new Error('unexpected community');
        }
        this.setSelectedCommunity(community);
      }
    } catch (error) {
      console.error('Failed to select node on server', error);
    }
  }

  public setSiteAdmin(isAdmin: boolean): void {
    this._setSiteAdmin(isAdmin);
  }

  public setNotifications(notifications: NotificationsController): void {
    this._setNotifications(notifications);
  }

  public setStarredCommunities(star: StarredCommunity[]): void {
    this._setStarredCommunities(star);
  }

  public isCommunityStarred(community_id: string): boolean {
    return (
      this._starredCommunities.findIndex((c) => {
        return c.community_id === community_id;
      }) !== -1
    );
  }

  public addStarredCommunity(star: StarredCommunity): void {
    this._starredCommunities.push(star);
  }

  public removeStarredCommunity(community_id: string, userId: number): void {
    const index = this._starredCommunities.findIndex(
      (s) => s.user_id === userId && s.community_id === community_id,
    );
    this._starredCommunities.splice(index, 1);
  }

  public setUnseenPosts(unseenPosts: object): void {
    this._setUnseenPosts(unseenPosts);
  }
}
