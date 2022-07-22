/* @jsx m */

import m from 'mithril';
import { Toaster } from 'construct-ui';

import app from 'state';

export class AppToasts implements m.ClassComponent {
  view() {
    return <Toaster toasts={app.toasts.getList()} />;
  }
}
