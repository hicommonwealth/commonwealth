import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
} from 'mithrilInterop';
// import { Toast, ToasterPosition, Intent, Icons, Size } from 'construct-ui';
import { uuidv4 } from 'lib/util';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelErrorCaptureEvent } from 'analytics/types';
// import { Icons, Intent, Size, Toast, ToasterPosition } from 'construct-ui';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
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
  }

  public createSuccess(message) {
    const key = uuidv4();
    // const toast = render(Toast, {
    //   key,
    //   message,
    //   onDismiss: this.remove.bind(this, key),
    //   timeout,
    //   icon: Icons.CHECK_CIRCLE,
    //   intent: Intent.POSITIVE,
    //   size: Size.DEFAULT,
    //   position: ToasterPosition.BOTTOM,
    // });
    // toast['_message'] = message;
    // this._toasts.push(toast);
  }

  public createError(message) {
    // mixpanelBrowserTrack({
    //   message,
    //   community: app.activeChainId(),
    //   isCustomDomain: app.isCustomDomain(),
    //   event: MixpanelErrorCaptureEvent.ERROR_CAPTURED,
    // });
    const key = uuidv4();
    // const toast = render(Toast, {
    //   key,
    //   message,
    //   onDismiss: this.remove.bind(this, key),
    //   timeout,
    //   icon: Icons.ALERT_TRIANGLE,
    //   intent: Intent.NEGATIVE,
    //   size: Size.DEFAULT,
    //   position: ToasterPosition.BOTTOM,
    // });
    // toast['_message'] = message;
    // this._toasts.push(toast);
  }

  public createInfo(message) {
    const key = uuidv4();
    // const toast = render(Toast, {
    //   key,
    //   message,
    //   onDismiss: this.remove.bind(this, key),
    //   timeout,
    //   icon: Icons.INFO,
    //   intent: Intent.NONE,
    //   size: Size.DEFAULT,
    //   position: ToasterPosition.BOTTOM,
    // });
    // toast['_message'] = message;
    // this._toasts.push(toast);
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
