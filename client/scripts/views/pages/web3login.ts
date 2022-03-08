/* eslint-disable @typescript-eslint/ban-types */
import 'pages/web3login.scss';

import m from 'mithril';
import { Spinner, Button } from 'construct-ui';
import app from 'state';

import { link } from 'helpers';
import Sublayout from 'views/sublayout';
import LoginWithWalletDropdown from '../components/login_with_wallet_dropdown';

const Web3LoginPage: m.Component<{}> = {
  view: (vnode) => {
    const loggingInWithAddress = m.route.param('loggingInWithAddress');
    const joiningCommunity = m.route.param('joiningCommunity');
    const joiningChain = m.route.param('joiningChain');
    const targetCommunity = m.route.param('targetCommunity');

    // oops! = address linking interrupted
    const loginCopy = loggingInWithAddress
      ? 'Login interrupted'
      : joiningCommunity || joiningChain
      ? 'Oops! An error occurred'
      : app.isLoggedIn()
      ? 'Oops! An error occurred'
      : 'Login interrupted';

    return m(
      Sublayout,
      {
        class: 'Web3LoginPage',
      },
      [
        m('.web3login-options', [
          m('h3', loginCopy),
          m(LoginWithWalletDropdown, {
            label: 'Try again',
            joiningChain,
            loggingInWithAddress,
          }),
          m.route.param('prev')
            ? link('a.web3login-go-home', m.route.param('prev'), 'Go back')
            : link(
                'a.web3login-go-home',
                app.isCustomDomain() ? '/' : `/${app.activeChainId()}`,
                'Go home'
              ),
        ]),
      ]
    );
  },
};

export default Web3LoginPage;
