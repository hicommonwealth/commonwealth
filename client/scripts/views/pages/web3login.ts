import 'pages/web3login.scss';

import m from 'mithril';
import { Spinner, Button } from 'construct-ui';
import app from 'state';

import { link } from 'helpers';
import Sublayout from 'views/sublayout';

const Web3LoginPage: m.Component<{}> = {
  view: (vnode) => {
    const loggingInWithAddress = m.route.param('loggingInWithAddress');
    const joiningCommunity = m.route.param('joiningCommunity');
    const joiningChain = m.route.param('joiningChain');
    const loginCopy = loggingInWithAddress ? 'Login interrupted' : (joiningCommunity || joiningChain)
      ? 'Address linking interrupted' : app.isLoggedIn() ? 'Address linking interrupted' : 'Login interrupted';

    return m(Sublayout, {
      class: 'Web3LoginPage',
    }, [
      m('.web3login-options', [
        m('h3', loginCopy),
        m(Button, {
          intent: 'primary',
          label: 'Try again',
          fluid: true,
          onclick: (e) => {
            app.modals.lazyCreate('link_new_address_modal', {
              loggingInWithAddress,
              joiningCommunity,
              joiningChain,
              successCallback: () => {
                m.route.set(
                  m.route.param('prev') ? m.route.param('prev') : app.activeId() ? `/${app.activeId()}` : '/'
                );
              }
            });
          },
        }),
        m.route.param('prev')
          ? link('a.web3login-go-home', m.route.param('prev'), 'Go back')
          : link('a.web3login-go-home', `/${app.activeId()}`, 'Go home'),
      ]),
    ]);
  }
};

export default Web3LoginPage;
