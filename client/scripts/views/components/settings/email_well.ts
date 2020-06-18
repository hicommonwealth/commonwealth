import 'components/settings/email_well.scss';
import 'components/settings/github_well.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { SocialAccount } from 'models';
import { Button, Colors, Input, Icons, Icon, Tooltip, Classes } from 'construct-ui';

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
    vnode.state.email = app.login.email;
    vnode.state.emailInputUpdated = false;
    vnode.state.verificationSent = false;
    vnode.state.emailVerified = app.login.emailVerified;
    vnode.state.githubAccount = app.login.socialAccounts.find((sa) => sa.provider === 'github');
    vnode.state.errorMessage = null;
  },
  view: (vnode) => {
    const { email, githubAccount, emailInputUpdated, emailVerified, verificationSent, errorMessage } = vnode.state;
    return [
      m('.EmailWell', [
        m('h4', 'Email'),
        m(Input, {
          placeholder: 'name@example.com',
          contentLeft: m(Icon, { name: Icons.MAIL }),
          defaultValue: app.login.email || null,
          oninput: (e) => {
            vnode.state.emailInputUpdated = true;
            vnode.state.verificationSent = false;
            vnode.state.email = (e.target as any).value;
          },
        }),
        m(Button, {
          intent: 'primary',
          label: (!emailInputUpdated && !emailVerified) ? 'Retry verification' : 'Update email',
          class: 'update-email-button',
          disabled: (!emailInputUpdated && emailVerified) || verificationSent,
          onclick: async () => {
            try {
              const response = await $.post(`${app.serverUrl()}/updateEmail`, {
                'email': vnode.state.email,
                'jwt': app.login.jwt,
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
          ? m('label', 'Check your email for a confirmation link')
          : [
            m(Icon, {
              size: 'lg',
              intent: emailVerified ? 'positive' : 'warning',
              name: emailVerified ? Icons.CHECK_CIRCLE : Icons.ALERT_CIRCLE,
            }),
            m('label', {
              style: { color: emailVerified ? Colors.GREEN900 : Colors.ORANGE900 }
            }, emailVerified ? 'Verified' : 'Not verified'),
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
                  data: { jwt: app.login.jwt },
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
