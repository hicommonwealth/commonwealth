import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup } from 'construct-ui';
import app from 'state';
import { loginWithMagicLink } from 'controllers/app/login';
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
                  try {
                    await loginWithMagicLink(email);
                    // do not redirect -- just close modal
                    $('.LoginModal').trigger('modalforceexit');
                  } catch (err) {
                    vnode.state.failure = true;
                    vnode.state.error = err.message;
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
