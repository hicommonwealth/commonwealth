import 'pages/loading.scss';

import m from 'mithril';
import { Spinner } from 'construct-ui';

const LoadingPage: m.Component<{}> = {
  view: (vnode) => {
    return m('.LoadingPage', [
      m(Spinner, { fill: true, size: 'xl', style: 'visibility: visible; opacity: 1;' }),
    ]);
  }
};

export default LoadingPage;
