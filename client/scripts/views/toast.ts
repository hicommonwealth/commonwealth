import m from 'mithril';
import { Toaster } from 'construct-ui';
import app from 'state';

const AppToasts: m.Component<{}> = {
  view: (vnode) => {
    return m(Toaster, {
      toasts: app.toasts.getList()
    });
  }
};

export default AppToasts;
