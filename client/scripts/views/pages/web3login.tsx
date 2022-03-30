/* @jsx m */

import m from 'mithril';
import app from 'state';

import 'pages/web3login.scss';

import { link } from 'helpers';
import Sublayout from 'views/sublayout';
import LoginWithWalletDropdown from '../components/login_with_wallet_dropdown';

class Web3LoginPage implements m.ClassComponent {
  view() {
    const loggingInWithAddress = m.route.param('loggingInWithAddress');
    const joiningCommunity = m.route.param('joiningCommunity');
    const joiningChain = m.route.param('joiningChain');

    // oops! = address linking interrupted
    const loginCopy = loggingInWithAddress
      ? 'Login interrupted'
      : joiningCommunity || joiningChain
      ? 'Oops! An error occurred'
      : app.isLoggedIn()
      ? 'Oops! An error occurred'
      : 'Login interrupted';

    return (
      <Sublayout>
        <div class="Web3LoginPage">
          <div class="web3-login-container">
            <h3>{loginCopy}</h3>
            {m(LoginWithWalletDropdown, {
              label: 'Try again',
              joiningChain,
              loggingInWithAddress,
            })}
            {m.route.param('prev')
              ? link('a.web3login-go-home', m.route.param('prev'), 'Go back')
              : link(
                  'a.web3login-go-home',
                  app.isCustomDomain() ? '/' : `/${app.activeChainId()}`,
                  'Go home'
                )}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default Web3LoginPage;
