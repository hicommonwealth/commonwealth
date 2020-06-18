import 'components/settings/email_well.scss';
import 'components/settings/github_well.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Colors } from 'construct-ui';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { SocialAccount } from 'models';
import { Button, Input, Icons, Icon, Tooltip, Classes } from 'construct-ui';

interface IState {
  email: string;
  emailVerified: boolean;
  emailUpdated: boolean;
  githubAccount: SocialAccount;
}

interface IAttrs {
  github: boolean;
}

const EmailWell: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.email = app.login.email;
    vnode.state.emailUpdated = false;
    vnode.state.emailVerified = app.login.emailVerified;
    vnode.state.githubAccount = app.login.socialAccounts.find((sa) => sa.provider === 'github');
  },
  view: (vnode) => {
    const { githubAccount, email, emailVerified, emailUpdated } = vnode.state;
    return [
      m('.EmailWell', [
        m('h4', 'Email'),
        m(Input, {
          contentLeft: m(Icon, { name: Icons.MAIL }),
          defaultValue: email || null,
          oninput: (e) => { vnode.state.email = (e.target as any).value; },
        }),
        m(Button, {
          label: 'Update email',
          disabled: email === app.login.email,
          onclick: async () => {
            try {
              if (email === app.login.email) return;
              const response = await $.post(`${app.serverUrl()}/updateEmail`, {
                'email': email,
                'jwt': app.login.jwt,
              });
              app.login.email = response.result.email;
              vnode.state.emailVerified = false;
              vnode.state.emailUpdated = true;
              m.redraw();
            } catch (err) {
              console.log('Failed to update email');
              throw new Error((err.responseJSON && err.responseJSON.error)
                ? err.responseJSON.error
                : 'Failed to update email');
            }
          }
        }),
        m(Icon, {
          size: 'lg',
          intent: emailVerified ? 'positive' : 'warning',
          name: emailVerified ? Icons.CHECK_CIRCLE : Icons.ALERT_CIRCLE,
        }),
        m('label', {
          style: { color: emailVerified ? Colors.GREEN900 : Colors.ORANGE900 }
        }, emailVerified ? 'Verified' : 'Not verified'),
        emailUpdated && m('p', 'Check your email to confirm this change'),
      ]),
      vnode.attrs.github && m('.GithubWell', [
        m('form', [
          m(Input, {
            value: `github.com/${githubAccount?.username}`,
            contentLeft: m(Icon, { name: Icons.GITHUB }),
            disabled: true,
          }),
          m(Button, {
            label: githubAccount ? 'Unlink Github' : 'Link Github',
            href: githubAccount ? '' : `${app.serverUrl()}/auth/github`,
            intent: githubAccount ? 'negative' : 'none',
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
