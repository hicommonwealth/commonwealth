import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';

interface IAttrs {
}

interface IState {
  disabled: boolean;
  success: boolean;
  failure: boolean;
  error: Error | string;
  forceRegularLogin: boolean; // show regular login form from NEAR page
}

const Login: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {

    if (app.chain && app.chain.base === ChainBase.NEAR && !vnode.state.forceRegularLogin) {
      return m('.Login', {
        onclick: (e) => {
          e.stopPropagation();
        }
      }, [
        m(Button, {
          class: 'login-button-black',
          onclick: async (e) => {
            e.preventDefault();
            $(e.target).trigger('menuclose');

            // set post-login redirect path
            localStorage.setItem('nearPostAuthRedirect', JSON.stringify({
              timestamp: (+new Date()).toString(),
              path: m.route.get()
            }));

            // redirect to NEAR page for login
            const WalletAccount = (/* webpackMode: "lazy" */ await import('nearlib')).WalletAccount;
            const wallet = new WalletAccount((app.chain as any).chain.api, null);
            if (wallet.isSignedIn()) {
              // get rid of pre-existing wallet info to make way for new account
              wallet.signOut();
            }
            const redirectUrl = `${window.location.origin}/${app.activeChainId()}/finishNearLogin`;
            wallet.requestSignIn('commonwealth', 'commonwealth', redirectUrl, redirectUrl);
          },
          label: [
            m('img.login-wallet-icon', { src: '/static/img/near_transparent_white.png' }),
            'Go to NEAR wallet',
          ]
        }),
        m('.more-options', [
          m('a', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              vnode.state.forceRegularLogin = true;
            }
          }, 'More options'),
        ]),
      ]);
    }

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
            disabled: vnode.state.disabled,
            type: 'submit',
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              const email = $(vnode.dom).find('[name="email"]').val().toString();
              const path = m.route.get();
              if (!email) return;
              vnode.state.disabled = true;
              vnode.state.success = false;
              vnode.state.failure = false;
              $.post(`${app.serverUrl()}/login`, { email, path }).then((response) => {
                vnode.state.disabled = false;
                if (response.status === 'Success') {
                  vnode.state.success = true;
                } else {
                  vnode.state.failure = true;
                  vnode.state.error = response.message;
                }
                m.redraw();
              }).catch((err: any) => {
                vnode.state.disabled = false;
                vnode.state.failure = true;
                vnode.state.error = (err && err.responseJSON && err.responseJSON.error) || err.statusText;
                m.redraw();
              });
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
          m(Button, {
            intent: 'primary',
            fluid: true,
            class: 'login-with-web3',
            onclick: (e) => {
              e.preventDefault();
              app.modals.lazyCreate('link_new_address_modal', { loggingInWithAddress: true });
              $(e.target).trigger('menuclose');
            },
            label: `Continue with ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} wallet`,
          }),
        ]),
      ]),
    ]);
  },
};

export default Login;
