// eslint-disable-next-line
import NotificationsController from './notifications';

export class UserController {
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
