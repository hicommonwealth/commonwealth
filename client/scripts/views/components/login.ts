import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';

interface IAttrs {
  creatingAccount?: boolean;
  hideHeader?: boolean;
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
    const { hideHeader, creatingAccount } = vnode.attrs;

    if (app.chain && app.chain.base === ChainBase.NEAR && !vnode.state.forceRegularLogin) {
      return m('.Login', {
        onclick: (e) => {
          e.stopPropagation();
        }
      }, [
        !hideHeader && m('h4', 'Log in or sign up'),
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
      !hideHeader && m('h4', creatingAccount ? 'Create account' : 'Log in or create account'),
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
            label: creatingAccount
              ? (vnode.state.disabled ? 'Creating account...' : 'Sign up')
              : (vnode.state.disabled ? 'Logging in...' : 'Log in')
          }),
        ])
      ]),
      vnode.state.success && m('.login-message.success', [
        creatingAccount
          ? 'Check your email to finish creating your account.'
          : 'Check your email to finish logging in.'
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
            label: creatingAccount ? 'Sign up with Github' : 'Log in with Github'
          }),
        ]),
      ]),
      m(Form, { gutter: 10 }, [
        m(FormGroup, { span: 12 }, [
          m(Button, {
            intent: 'primary',
            fluid: true,
            class: 'login-with-web3',
            onclick: async (e) => {
              e.preventDefault();
              const LinkNewAddressModal = await import(/* webpackMode: "lazy" */ '../modals/link_new_address_modal');
              $(e.target).trigger('menuclose');
              app.modals.create({ modal: LinkNewAddressModal.default, data: { loggingInWithAddress: true } });
            },
            label: creatingAccount
              ? `Sign up with ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} wallet`
              : `Log in with ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} wallet`,
          }),
        ]),
      ]),
    ]);
  },
};

export default Login;
