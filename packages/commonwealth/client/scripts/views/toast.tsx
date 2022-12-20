/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';
import { Toaster } from 'construct-ui';

import app from 'state';

export class AppToasts extends ClassComponent {
  view() {
    return render(Toaster, { toasts: app.toasts.getList() });
  }
}
