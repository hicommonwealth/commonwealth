/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import 'pages/web3login.scss';

import { link } from 'helpers';
import Sublayout from 'views/sublayout';
import { CWButton } from '../components/component_kit/cw_button';
import { PageNotFound } from './404';
import { CWText } from '../components/component_kit/cw_text';
import { NewLoginModal } from '../modals/login_modal';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';

class Web3LoginPage implements m.ClassComponent {
  private error?: string;

  view() {
    const token = m.route.param('connect');
    if (app.isCustomDomain() || !token) {
      // hide page if invalid arguments or via custom domain
      return <PageNotFound />;
    }

    // hit auth callback and redirect
    const onSuccess = async () => {
      if (!app.isLoggedIn()) {
        // user should never be logged out when this method is called
        return;
      }
      try {
        const { status, result } = await $.get(
          `${app.serverUrl()}/auth/callback`,
          {
            jwt: app.user.jwt,
            token,
          }
        );
        if (status === 'Success') {
          const responseToken = result;
          // REDIRECT TO CMNBOT
          window.location.href = `http://localhost:3000/success/${responseToken}`;
        } else {
          console.error('Unknown error occurred', status, result);
        }
      } catch (e) {
        this.error = e.responseJSON.error;
        m.redraw();
      }
    };

    return (
      <Sublayout>
        <div class="Web3LoginPage">
          <div class="web3-login-container">
            {/* <h3>{app.isLoggedIn() ? 'Connect to Commonwealth': 'Log into Commonwealth'}</h3> */}
            <CWButton
              label="Connect"
              buttonType="lg-primary-blue"
              onclick={() => {
                if (app.isLoggedIn()) {
                  onSuccess();
                } else {
                  app.modals.create({
                    modal: NewLoginModal,
                    data: {
                      onSuccess,
                      modalType: isWindowMediumSmallInclusive(window.innerWidth)
                        ? 'fullScreen'
                        : 'centered',
                      breakpointFn: isWindowMediumSmallInclusive,
                    },
                  });
                }
              }}
            />
            {m.route.param('prev')
              ? link('a.web3login-go-home', m.route.param('prev'), 'Go back')
              : link(
                  'a.web3login-go-home',
                  app.isCustomDomain() ? '/' : `/${app.activeChainId()}`,
                  'Go home'
                )}
            {this.error && <CWText>{this.error}</CWText>}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default Web3LoginPage;
