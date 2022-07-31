import m from 'mithril';
import { Toast, ToasterPosition, Intent, Icons, Size } from 'construct-ui';
import { uuidv4 } from 'lib/util';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelErrorCaptureEvent } from 'analytics/types';
import app from 'state';

const timeout = 3000;

export class ToastStore {
  private _toasts: any[];
  constructor() {
    this._toasts = [];
  }

  public remove(key) {
    const index = this._toasts.findIndex((t) => t.key === key);
    if (index === -1) return;
    this._toasts.splice(index, 1);
    m.redraw();
  }

  public createSuccess(message) {
    const key = uuidv4();
    const toast = m(Toast, {
      key,
      message,
      onDismiss: this.remove.bind(this, key),
      timeout,
      icon: Icons.CHECK_CIRCLE,
      intent: Intent.POSITIVE,
      size: Size.DEFAULT,
      position: ToasterPosition.BOTTOM,
    });
    toast['_message'] = message;
    this._toasts.push(toast);
    m.redraw();
  }
  public createError(message) {
    mixpanelBrowserTrack({
      message,
      community: app.activeChainId(),
      isCustomDomain: app.isCustomDomain(),
      event: MixpanelErrorCaptureEvent.ERROR_CAPTURED,
    });
    const key = uuidv4();
    const toast = m(Toast, {
      key,
      message,
      onDismiss: this.remove.bind(this, key),
      timeout,
      icon: Icons.ALERT_TRIANGLE,
      intent: Intent.NEGATIVE,
      size: Size.DEFAULT,
      position: ToasterPosition.BOTTOM,
    });
    toast['_message'] = message;
    this._toasts.push(toast);
    m.redraw();
  }
  public createInfo(message) {
    const key = uuidv4();
    const toast = m(Toast, {
      key,
      message,
      onDismiss: this.remove.bind(this, key),
      timeout,
      icon: Icons.INFO,
      intent: Intent.NONE,
      size: Size.DEFAULT,
      position: ToasterPosition.BOTTOM,
    });
    toast['_message'] = message;
    this._toasts.push(toast);
    m.redraw();
  }

  public getList() {
    return this._toasts;
  }
}

const TOAST_STORE = new ToastStore();

// Enforce singleton ToastStore
export function getToastStore() {
  return TOAST_STORE;
}
