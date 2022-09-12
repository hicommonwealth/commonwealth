/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import 'pages/web3login.scss';

import { link } from 'helpers';
import Sublayout from 'views/sublayout';
import LoginWithWalletDropdown from '../components/login_with_wallet_dropdown';
import { PageNotFound } from './404';

class Web3LoginPage implements m.ClassComponent {
  view() {
    const token = m.route.param('connect');
    if (app.isCustomDomain() || !token) {
      // hide page if invalid arguments or via custom domain
      return (
        <PageNotFound />
      );
    }

    // hit auth callback and redirect
    const onSuccess = async () => {
      if (!app.isLoggedIn()) {
        // TODO: fail
        return;
      }
      const { status, result } = await $.get(
        `${app.serverUrl()}/auth/callback`,
        {
          jwt: app.user.jwt,
          token,
          // profile_id,
        }
      );
      if (status === 'Success') {
        const responseToken = result;
        // REDIRECT TO CMNBOT
        window.location.href = `http://localhost:3000?token=${responseToken}`;
      } else {
        // TODO: display error
      }
    };

    // TODO: handle case where already logged in (immediate redirect after auth callback)
    return (
      <Sublayout>
        <div class="Web3LoginPage">
          <div class="web3-login-container">
            <h3>Log into Commonwealth</h3>
            {m(LoginWithWalletDropdown, {
              label: 'Log In',
              joiningChain: null,
              loggingInWithAddress: true,
              onSuccess,
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
