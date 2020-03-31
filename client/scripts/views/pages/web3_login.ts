import 'pages/web3_login.scss';

import { default as m } from 'mithril';
import ObjectPage from 'views/pages/_object_page';
import app from 'state';

const Web3LoginPage: m.Component<{}> = {
  view: (vnode) => {
    if (app.modals.getList().length === 0) {
      m.route.set('/');
    }

    return m(ObjectPage, {
      class: 'Web3LoginPage',
      content: m('.loading-icon', [
        m('span.icon-spinner2.animate-spin')
      ]),
    });
  }
};

export default Web3LoginPage;
