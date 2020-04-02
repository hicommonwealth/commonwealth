import 'components/login.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { default as mixpanel } from 'mixpanel-browser';
import { WalletAccount } from 'nearlib';

import app from 'state';
import { ChainBase } from 'models';
import { formatAsTitleCase } from 'helpers';
import Near from 'controllers/chain/near/main';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';

interface IAttrs {
  creatingAccount?: boolean;
}

interface IState {
  disabled?: boolean;
  success?: boolean;
  failure?: boolean;
  error?: Error | string;
}

const Login: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const creatingAccount = !!vnode.attrs.creatingAccount;

    if (app.chain && app.chain.base === ChainBase.NEAR) {
      return m('.Login', {
        onclick: (e) => {
          e.stopPropagation();
        }
      }, [
        m('h4', 'Log in or sign up'),
        m('a.btn.login-wallet-button.formular-button-black', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            $(e.target).trigger('menuclose');

            // set post-login redirect path
            localStorage.setItem('nearPostAuthRedirect', JSON.stringify({
              timestamp: (+new Date()).toString(),
              path: m.route.get()
            }));

            // redirect to NEAR page for login
            const wallet = new WalletAccount((app.chain as Near).chain.api, null);
            if (wallet.isSignedIn()) {
              // get rid of pre-existing wallet info to make way for new account
              wallet.signOut();
            }
            const redirectUrl = `${window.location.origin}/${app.activeChainId()}/finishNearLogin`;
            wallet.requestSignIn('commonwealth', 'commonwealth', redirectUrl, redirectUrl);
          }
        }, [
          m('img.login-wallet-icon', { src: '/static/img/near_transparent_white.png' }),
          'Go to NEAR wallet',
        ])
      ]);
    }

    return m('.Login', {
      onclick: (e) => {
        e.stopPropagation();
      }
    }, [
      m('h4', creatingAccount ? 'Create account' : 'Log in or create account'),
      m('form.login-option', [
        m('input[type="text"]', {
          name: 'email',
          placeholder: 'Email',
          autocomplete: 'off',
          onclick: (e) => {
            e.stopPropagation();
          },
          oncreate: (vnode) => {
            $(vnode.dom).focus();
          }
        }),
        m('button', {
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
            $.post(app.serverUrl() + '/login', { email, path }).then((response) => {
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
          }
        }, creatingAccount ?
          (vnode.state.disabled ? 'Creating account...' : 'Sign up') :
          (vnode.state.disabled ? 'Logging in...' : 'Log in with email')),
        vnode.state.success && m('.login-message.success', [
          creatingAccount ?
            'Check your email to finish creating your account.' :
            'Check your email to finish logging in.'
        ]),
        vnode.state.failure && m('.login-message.failure', [
          vnode.state.error || 'An error occurred.'
        ]),
      ]),
      m('form.login-option', [
        m('a.btn.formular-button-black', {
          href: app.serverUrl() + '/auth/github',
          class: 'login-with-github',
          onclick: (e) => {
            localStorage.setItem('githubPostAuthRedirect', JSON.stringify({
              timestamp: (+new Date()).toString(),
              path: m.route.get()
            }));
          }
        }, creatingAccount ? 'Sign up with Github' : 'Log in with Github'),
        m('a.btn.formular-button-black', {
          class: 'login-with-web3',
          onclick: (e) => {
            e.preventDefault();
            $(e.target).trigger('menuclose');
            app.modals.create({ modal: LinkNewAddressModal, data: { loggingInWithAddress: true } });
          }
        }, [
          creatingAccount ?
            `Sign up with ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} wallet` :
            `Log in with ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} wallet`,
        ])
      ])
    ]);
  },
};

export default Login;
