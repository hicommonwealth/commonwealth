import 'pages/loading.scss';

import m from 'mithril';
import { Spinner } from 'construct-ui';

const LoadingPage: m.Component<{ message?: string }> = {
  view: (vnode) => {
    return m('.LoadingPage', [
      m(Spinner, {
        fill: true,
        message: vnode.attrs.message,
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      }),
    ]);
  }
};

export default LoadingPage;
