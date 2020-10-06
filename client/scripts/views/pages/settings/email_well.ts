import 'pages/settings/email_well.scss';
import 'pages/settings/github_well.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, Colors, Input, Icons, Icon, Tooltip, Classes } from 'construct-ui';

import { SocialAccount } from 'models';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import SettingsController from 'controllers/app/settings';

interface IState {
  email: string;
  emailInputUpdated: boolean;
  verificationSent: boolean;
  emailVerified: boolean;
  githubAccount: SocialAccount;
  errorMessage: string;
}

interface IAttrs {
  github: boolean;
}

const EmailWell: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.email = app.user.email;
    vnode.state.emailInputUpdated = false;
    vnode.state.verificationSent = false;
    vnode.state.emailVerified = app.user.emailVerified;
    vnode.state.githubAccount = app.user.socialAccounts.find((sa) => sa.provider === 'github');
    vnode.state.errorMessage = null;
  },
  view: (vnode) => {
    const { email, githubAccount, emailInputUpdated, emailVerified, verificationSent, errorMessage } = vnode.state;
    return [
      m('.EmailWell', [
        m('h4', 'Login'),
        m(Input, {
          placeholder: 'name@example.com',
          contentLeft: m(Icon, { name: Icons.MAIL }),
          defaultValue: app.user.email || null,
          oninput: (e) => {
            vnode.state.emailInputUpdated = true;
            vnode.state.verificationSent = false;
            vnode.state.email = (e.target as any).value;
          },
        }),
        (!app.user.email || emailInputUpdated || !emailVerified) && m(Button, {
          intent: 'primary',
          label: (app.user.email && !emailInputUpdated && !emailVerified) ? 'Retry verification' : 'Update email',
          class: 'update-email-button',
          disabled: (!emailInputUpdated && emailVerified) || verificationSent,
          onclick: async () => {
            vnode.state.errorMessage = null;
            const confirmed = await confirmationModalWithText(
              'You will be required to confirm your new email address. Continue?'
            )();
            if (!confirmed) return;
            try {
              const response = await $.post(`${app.serverUrl()}/updateEmail`, {
                'email': vnode.state.email,
                'jwt': app.user.jwt,
              });
              vnode.state.emailVerified = false;
              vnode.state.verificationSent = true;
              vnode.state.errorMessage = null;
              m.redraw();
            } catch (err) {
              vnode.state.errorMessage = err.responseJSON.error;
              m.redraw();
              console.log('Failed to update email');
              throw new Error((err.responseJSON && err.responseJSON.error)
                ? err.responseJSON.error
                : 'Failed to update email');
            }
          }
        }),
        verificationSent
          ? m('label', {
            style: {
              color: Colors.GREEN500,
              position: 'relative',
              top: '2px',
            }
          }, 'Check your email for a confirmation link')
          : [
            m(Icon, {
              size: 'lg',
              intent: emailVerified ? 'positive' : 'warning',
              name: emailVerified ? Icons.CHECK_CIRCLE : Icons.ALERT_CIRCLE,
            }),
            m('label', {
              style: {
                color: emailVerified ? Colors.GREEN500 : '#f57c01',
                position: 'relative',
                top: '2px',
              }
            }, emailVerified ? 'Verified' : app.user.email ? 'Not verified' : 'No email provided'),
          ],
        errorMessage && m('p.error', errorMessage),
      ]),
      vnode.attrs.github && m('.GithubWell', [
        m('form', [
          githubAccount && m(Input, {
            value: `github.com/${githubAccount.username || ''}`,
            contentLeft: m(Icon, { name: Icons.GITHUB }),
            disabled: true,
          }),
          m(Button, {
            label: githubAccount ? 'Unlink Github' : 'Link Github',
            intent: githubAccount ? 'negative' : 'primary',
            onclick: () => {
              if (githubAccount) {
                $.ajax({
                  url: `${app.serverUrl()}/githubAccount`,
                  data: { jwt: app.user.jwt },
                  type: 'DELETE',
                  success: (result) => {
                    vnode.state.githubAccount = null;
                    m.redraw();
                  },
                  error: (err) => {
                    console.dir(err);
                    m.redraw();
                  },
                });
              } else {
                localStorage.setItem('githubPostAuthRedirect', JSON.stringify({
                  timestamp: (+new Date()).toString(),
                  path: m.route.get()
                }));
                document.location = `${app.serverUrl()}/auth/github` as any;
                m.redraw();
              }
            },
          })
        ]),
      ])
    ];
  },
};

export default EmailWell;
