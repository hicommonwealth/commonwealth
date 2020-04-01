import m from 'mithril';
import { Toaster } from 'construct-ui';
import app from 'state';

export const AppToasts = {
  view: (vnode) => {
    return m(Toaster, {
      toasts: app.toasts.getList()
    });
  }
};
