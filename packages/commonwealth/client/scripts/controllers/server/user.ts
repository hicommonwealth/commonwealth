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
  private _setActiveAccount(account: Account): void {
    this._activeAccount = account;
  }
  // Recommend using the setActiveAccount helper in controllers/app/login.ts to persist the setting to the backend.
  public ephemerallySetActiveAccount(account: Account): void {
    this._setActiveAccount(account);
    this.isFetched.emit('redraw');
  }

  public isFetched = new EventEmitter();

  private _jwt: string;
  public get jwt(): string {
    return this._jwt;
  }

  private _setJWT(JWT: string): void {
    this._jwt = JWT;
  }

  public setJWT(JWT: string): void {
    this._setJWT(JWT);
  }

  constructor() {}

  // --- TODO: should this be migrated as well? -- since this will be deprecated
  private _notifications: NotificationsController =
    new NotificationsController();
  public get notifications(): NotificationsController {
    return this._notifications;
  }
  private _setNotifications(notifications: NotificationsController): void {
    this._notifications = notifications;
  }
  public setNotifications(notifications: NotificationsController): void {
    this._setNotifications(notifications);
  }
}
