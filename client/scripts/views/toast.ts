import m from 'mithril';
import { Toaster } from 'construct-ui';
import app from 'state';

const Toasts = {
  view: (vnode) => {
    return m(Toaster, {
      toasts: app.toasts.getList()
    });
  }
};

export default Toasts;
