import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, Checkbox } from 'construct-ui';
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
  usingMagic: boolean;
}> = {
  view: (vnode) => {
    const usingMagic = vnode.state.usingMagic;
    return m('.Login', {
      onclick: (e) => {
        e.stopPropagation();
      }
    }, [
      m(Checkbox, {
        checked: !!usingMagic,
        size: 'lg',
        onchange: async (e) => {
          e.preventDefault();
          vnode.state.usingMagic = !usingMagic;
          m.redraw();
        }
      }, 'Use Magic Link'),
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
              // TODO: pass in ETH config
              let query: JQuery.jqXHR;
              if (usingMagic) {
                try {
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
                  });
                  console.log(response);
                  if (response.status === 'Success') {
                    // if success, move immediately to next login step -- do not wait for user
                    // TODO: verify the address

                    // log in as the new user
                    // TODO: make this not just redirect to ethereum
                    const chain = response.result.Addresses[0].chain;
                    $('.LoginModal').trigger('modalforceexit');
                    await initAppState(false);
                    await updateActiveAddresses(chain);
                    m.route.set(`/${chain}`);
                  } else {
                    vnode.state.failure = true;
                    vnode.state.error = response.message;
                  }
                } catch (err) {
                  vnode.state.disabled = false;
                  vnode.state.failure = true;
                  vnode.state.error = (err && err.responseJSON && err.responseJSON.error) || err.statusText;
                  m.redraw();
                }
              } else {
                try {
                  const response = await $.post(`${app.serverUrl()}/login`, { email, path });
                  vnode.state.disabled = false;
                  if (response.status === 'Success') {
                    vnode.state.success = true;
                  } else {
                    vnode.state.failure = true;
                    vnode.state.error = response.message;
                  }
                  m.redraw();
                } catch (err) {
                  vnode.state.disabled = false;
                  vnode.state.failure = true;
                  vnode.state.error = (err && err.responseJSON && err.responseJSON.error) || err.statusText;
                  m.redraw();
                }
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
