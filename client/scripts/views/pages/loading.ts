import 'pages/loading.scss';

import m from 'mithril';
import { Spinner } from 'construct-ui';
import Sublayout from 'views/sublayout';

const LoadingPage: m.Component<{ message?: string }> = {
  view: (vnode) => {
    return m(Sublayout, {
      class: 'LoadingPage',
    }, [
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
