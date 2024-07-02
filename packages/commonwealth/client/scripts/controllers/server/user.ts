/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-imports */

import Account from '../../models/Account';

// eslint-disable-next-line
import { EventEmitter } from 'events';
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

  private _jwt: string;
  public get jwt(): string {
    return this._jwt;
  }

  private _setJWT(JWT: string): void {
    this._jwt = JWT;
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

  private _notifications: NotificationsController =
    new NotificationsController();
  public get notifications(): NotificationsController {
    return this._notifications;
  }

  private _setNotifications(notifications: NotificationsController): void {
    this._notifications = notifications;
  }

  constructor() {}

  // Recommend using the setActiveAccount helper in controllers/app/login.ts to persist the setting to the backend.
  public ephemerallySetActiveAccount(account: Account): void {
    this._setActiveAccount(account);
    this.isFetched.emit('redraw');
  }

  public setJWT(JWT: string): void {
    this._setJWT(JWT);
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

  public setNotifications(notifications: NotificationsController): void {
    this._setNotifications(notifications);
  }
}
