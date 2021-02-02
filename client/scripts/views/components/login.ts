import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup } from 'construct-ui';
import { Magic } from 'magic-sdk';
import app from 'state';
import { initAppState } from 'app';
import { updateActiveAddresses } from 'controllers/app/login';
import LoginWithWalletDropdown from 'views/components/login_with_wallet_dropdown';

const Login: m.Component<{}, {
  disabled: boolean;
  success: boolean;
  failure: boolean;
  error: Error | string;
  forceRegularLogin: boolean; // show regular login form from NEAR page

}> = {
  view: (vnode) => {
    return m('.Login', {
      onclick: (e) => {
        e.stopPropagation();
      }
    }, [
      m(Form, { gutter: 10 }, [
        m(FormGroup, { span: 9 }, [
          m(Input, {
            fluid: true,
            name: 'email',
            placeholder: 'Email',
            autocomplete: 'off',
            onclick: (e) => {
              e.stopPropagation();
            },
            oncreate: (vvnode) => {
              $(vvnode.dom).focus();
            }
          }),
        ]),
        m(FormGroup, { span: 3 }, [
          m(Button, {
            intent: 'primary',
            fluid: true,
            // must be inside a chain/community in order to use magic login
            // TODO: tell the user this somehow
            disabled: vnode.state.disabled,
            rounded: true,
            type: 'submit',
            onclick: async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const email = $(e.target).closest('.Login').find('[name="email"]').val()
                .toString();
              const path = m.route.get();
              if (!email) return;
              vnode.state.disabled = true;
              vnode.state.success = false;
              vnode.state.failure = false;

              // attempt legacy login first -- will bounce if we need to use magic instead
              try {
                const legacyResponse = await $.post(`${app.serverUrl()}/login`, {
                  'chain': app.activeChainId(),
                  'community': app.activeCommunityId(),
                  email,
                  path,
                });

                // use magic if legacy response tells us to do so
                if (legacyResponse.status === 'Success' && legacyResponse.result?.shouldUseMagic) {
                  const magic = new Magic('pk_test_436D33AFC319E080');
                  const didToken = await magic.auth.loginWithMagicLink({ email });
                  const response = await $.post({
                    url: `${app.serverUrl()}/auth/magic`,
                    headers: {
                      Authorization: `Bearer ${didToken}`,
                    },
                    xhrFields: {
                      withCredentials: true
                    },
                    data: {
                      // send chain/community to request
                      'chain': app.activeChainId(),
                      'community': app.activeCommunityId(),
                    },
                  });
                  if (response.status === 'Success') {
                    // do not redirect -- just close modal
                    $('.LoginModal').trigger('modalforceexit');

                    // log in as the new user (assume all verification done server-side)
                    await initAppState(false);
                    if (app.community) {
                      await updateActiveAddresses(undefined);
                    } else if (app.chain) {
                      const c = app.user.selectedNode
                        ? app.user.selectedNode.chain
                        : app.config.nodes.getByChain(app.activeChainId())[0].chain;
                      await updateActiveAddresses(c);
                    }
                  } else {
                    vnode.state.failure = true;
                    vnode.state.error = response.message;
                  }
                } else if (legacyResponse.status === 'Success') {
                  // successfully kicked off a legacy-style login
                  vnode.state.success = true;
                } else {
                  vnode.state.failure = true;
                  vnode.state.error = legacyResponse.message;
                }
                vnode.state.disabled = false;
                m.redraw();
              } catch (err) {
                vnode.state.disabled = false;
                vnode.state.failure = true;
                vnode.state.error = (err && err.responseJSON && err.responseJSON.error) || err.statusText;
                m.redraw();
              }
            },
            label: 'Go',
            loading: vnode.state.disabled,
          }),
        ])
      ]),
      vnode.state.success && m('.login-message.success', [
        'Check your email to continue.'
      ]),
      vnode.state.failure && m('.login-message.failure', [
        vnode.state.error || 'An error occurred.'
      ]),

      m('.form-divider', 'or'),
      m(Form, { gutter: 10 }, [
        m(FormGroup, { span: 12 }, [
          m(Button, {
            intent: 'primary',
            fluid: true,
            rounded: true,
            href: `${app.serverUrl()}/auth/github`,
            onclick: (e) => {
              localStorage.setItem('githubPostAuthRedirect', JSON.stringify({
                timestamp: (+new Date()).toString(),
                path: m.route.get()
              }));
            },
            label: 'Continue with Github'
          }),
        ]),
      ]),
      m(Form, { gutter: 10 }, [
        m(FormGroup, { span: 12 }, [
          m(LoginWithWalletDropdown, {
            label: 'Continue with wallet',
            joiningChain: null,
            joiningCommunity: null,
            loggingInWithAddress: true,
          }),
        ]),
      ]),
    ]);
  },
};

export default Login;
