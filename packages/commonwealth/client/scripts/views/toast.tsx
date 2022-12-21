/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import { Toaster } from 'construct-ui';

import app from 'state';

export class AppToasts extends ClassComponent {
  view() {
    return render(Toaster, { toasts: app.toasts.getList() });
  }
}
