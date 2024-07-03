// eslint-disable-next-line
import NotificationsController from './notifications';

export class UserController {
  private _jwt: string;
  public get jwt(): string {
    return this._jwt;
  }

  public setJWT(JWT: string): void {
    this._jwt = JWT;
  }

  constructor() { }

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
