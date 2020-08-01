import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, PopoverMenu, MenuItem, Icon, Icons } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

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
            disabled: vnode.state.disabled,
            type: 'submit',
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              const email = $(e.target).closest('.Login').find('[name="email"]').val().toString();
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
          app.chain
            ? m(Button, {
              intent: 'primary',
              fluid: true,
              class: 'login-with-web3',
              label: `Continue with ${(app.chain.chain.denom) || ''} wallet`,
              onclick: (e) => {
                $(e.target).trigger('modalexit');
                m.route.set(`/${app.chain.id}/web3login`);
                app.modals.lazyCreate('link_new_address_modal', { loggingInWithAddress: true });
              }
            })
            : m(PopoverMenu, {
              trigger: m(Button, {
                intent: 'primary',
                fluid: true,
                class: 'login-with-web3',
                label: 'Continue with wallet',
              }),
              class: 'LoginPopoverMenu',
              transitionDuration: 0,
              content: app.config.chains.getAll().map((chain) => {
                return m(MenuItem, {
                  label: m('.chain-login-label', [
                    m(ChainIcon, { chain, size: 20 }),
                    m('.chain-login-label-name', chain.name),
                  ]),
                  onclick: (e) => {
                    $(e.target).trigger('modalexit');
                    m.route.set(`/${chain.id}/web3login`);
                    app.modals.lazyCreate('link_new_address_modal', { loggingInWithAddress: true });
                  }
                });
              }),
          }),
        ]),
      ]),
    ]);
  },
};

export default Login;
