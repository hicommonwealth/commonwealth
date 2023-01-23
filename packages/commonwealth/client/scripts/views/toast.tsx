/* @jsx m */

import ClassComponent from 'class_component';
import { Toaster } from 'construct-ui';
import m from 'mithril';

import app from 'state';

export class AppToasts extends ClassComponent {
  view() {
    return m(Toaster, { toasts: app.toasts.getList() });
  }
}
