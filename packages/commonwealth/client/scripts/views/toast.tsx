/* @jsx m */

import m from 'mithril';
import { ClassComponent } from 'mithrilInterop';
import { Toaster } from 'construct-ui';

import app from 'state';

export class AppToasts extends ClassComponent {
  view() {
    return m(Toaster, { toasts: app.toasts.getList() });
  }
}
