/* @jsx jsx */
import React from 'react';

import { ClassComponent, jsx } from 'mithrilInterop';

export class AppToasts extends ClassComponent {
  view() {
    return null;
    // return m(Toaster, { toasts: app.toasts.getList() });
  }
}
