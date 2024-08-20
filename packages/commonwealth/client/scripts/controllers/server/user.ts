// eslint-disable-next-line
import NotificationsController from './notifications';

export class UserController {
  constructor() {}

  // TODO: should be purged after knock integration:
  // https://github.com/hicommonwealth/commonwealth/pull/8312#discussion_r1672535396
  private _notifications: NotificationsController =
    new NotificationsController();
  public get notifications(): NotificationsController {
    return this._notifications;
  }
}
