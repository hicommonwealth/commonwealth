import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup } from 'construct-ui';
import app from 'state';
import { loginWithMagicLink } from 'controllers/app/login';
import LoginWithWalletDropdown from 'views/components/login_with_wallet_dropdown';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';

const exitWithLoginComplete = () => {
  $('.LoginModal').trigger('modalforceexit');

  if (app.user?.activeAccount && !app.user.activeAccount.profile?.name) {
    app.modals.create({
      modal: LinkNewAddressModal,
      data: { alreadyInitializedAccount: app.user.activeAccount },
      exitCallback: () => {
        // TODO:
      }
    });
  }

  m.redraw();
};

const Login: m.Component<{}, {
  disabled: boolean;
  showMagicLoginPrompt: boolean;
  showMagicLoginPromptEmail: string;
  emailLoginSucceeded: boolean;
  failure: boolean;
  error: Error | string;
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
            disabled: vnode.state.showMagicLoginPrompt,
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
              vnode.state.emailLoginSucceeded = false;
              vnode.state.failure = false;

              // attempt legacy login first -- will bounce if we need to use magic instead
              try {
                const legacyResponse = await $.post(`${app.serverUrl()}/login`, {
                  'chain': app.activeChainId(),
                  'community': app.activeCommunityId(),
                  email,
                  path,
                });

                if (legacyResponse.status === 'Success' && legacyResponse.result?.shouldUseMagic) {
                  // immediately log us into magic if legacy response tells us to do so
                  if (legacyResponse.result.shouldUseMagicImmediately) {
                    await loginWithMagicLink(email);
                    // do not redirect -- just close modal
                    vnode.state.disabled = false;
                    exitWithLoginComplete();
                    return;
                  }

                  // otherwise, prompt to choose between magic and legacy-style login
                  setTimeout(() => {
                    vnode.state.showMagicLoginPrompt = true;
                    vnode.state.showMagicLoginPromptEmail = $(e.target).closest('.Login').find('[name="email"]').val()
                      .toString();
                    vnode.state.disabled = false;
                    m.redraw();
                  }, 500);
                } else if (legacyResponse.status === 'Success') {
                  // use legacy-style login otherwise
                  vnode.state.emailLoginSucceeded = true;
                  vnode.state.disabled = false;
                  m.redraw();
                } else {
                  vnode.state.failure = true;
                  vnode.state.error = legacyResponse.message;
                  vnode.state.disabled = false;
                  m.redraw();
                }
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
      vnode.state.failure ? m('.login-message.failure', [
        vnode.state.error || 'An error occurred.'
      ]) : vnode.state.emailLoginSucceeded ? m('.login-message.success', [
        'Check your email to continue.'
      ]) : vnode.state.showMagicLoginPrompt ? m('.login-magic-prompt', [
        m('p', [
          'Commonwealth requires a crypto address to post. Generate one attached to ',
          m('strong', vnode.state.showMagicLoginPromptEmail),
          '?',
        ]),
        m('.login-magic-prompt-buttons', [
          m(Button, {
            label: 'Yes, generate an address for me',
            intent: 'primary',
            rounded: true,
            compact: true,
            onclick: async (e) => {
              e.preventDefault();
              try {
                vnode.state.disabled = true;
                await loginWithMagicLink(vnode.state.showMagicLoginPromptEmail);
                vnode.state.disabled = false;
                // do not redirect -- just close modal
                exitWithLoginComplete();
              } catch (err) {
                vnode.state.disabled = false;
                vnode.state.failure = true;
                vnode.state.error = err.message;
              }
            },
          }),
          m(Button, {
            label: 'No, I’ll use my own wallet',
            intent: 'none',
            rounded: true,
            compact: true,
            onclick: async (e) => {
              e.preventDefault();
              vnode.state.disabled = true;
              const path = m.route.get();
              const email = $(e.target).closest('.Login').find('[name="email"]').val()
                .toString();
              const legacyResponse = await $.post(`${app.serverUrl()}/login`, {
                'chain': app.activeChainId(),
                'community': app.activeCommunityId(),
                email,
                path,
                forceEmailLogin: true,
              });

              if (legacyResponse.status === 'Success') {
                // successfully kicked off a legacy-style login
                vnode.state.emailLoginSucceeded = true;
              } else {
                vnode.state.failure = true;
                vnode.state.error = legacyResponse.message;
              }
              vnode.state.disabled = false;
              m.redraw();
            },
          }),
        ]),
      ]) : '',
      !vnode.state.showMagicLoginPrompt && [
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
      ]
    ]);
  },
};

export default Login;
