/* @jsx m */

import m from 'mithril';
import { Toaster } from 'construct-ui';

import app from 'state';

export class AppToasts implements m.ClassComponent {
  view() {
    return m(Toaster, { toasts: app.toasts.getList() });
  }
}
