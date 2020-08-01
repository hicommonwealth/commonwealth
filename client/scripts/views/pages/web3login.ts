import 'pages/web3login.scss';

import m from 'mithril';
import { Spinner } from 'construct-ui';
import app from 'state';
import Sublayout from 'views/sublayout';

const Web3LoginPage: m.Component<{}> = {
  oncreate: () => {
    if (app.modals.getList().length === 0) {
      if (m.route.param('prev')) {
        m.route.set(m.route.param('prev'), {}, { replace: true });
      } else {
        m.route.set('/', {}, { replace: true });
      }
    }
  },
  view: (vnode) => {
    return m(Sublayout, {
      class: 'Web3LoginPage',
    }, [
      m(Spinner, { fill: true, size: 'xl', style: 'visibility: visible; opacity: 1;' }),
    ]);
  }
};

export default Web3LoginPage;
