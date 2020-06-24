import $ from 'jquery';
import app from 'state';

import { notifyError } from 'controllers/app/notifications';

class SettingsController {
  public static async disableRichText(value: boolean) {
    if (!app.isLoggedIn()) return;
    return new Promise((resolve, reject) => {
      $.post(`${app.serverUrl()}/writeUserSetting`, {
        jwt: app.user.jwt,
        key: 'disableRichText',
        value: value ? 'true' : 'false',
      }).then((result) => {
        app.user.setDisableRichText(value);
        resolve();
      }).catch((e) => {
        console.error(e);
        notifyError('Could not update setting');
        reject(e);
      });
    });
  }
}

export default SettingsController;
