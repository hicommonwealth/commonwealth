/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import app from 'state';

export class AppToasts extends ClassComponent {
  view() {
    return null;
    // return m(Toaster, { toasts: app.toasts.getList() });
  }
}
