import 'components/settings/github_well.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { SocialAccount } from 'models';
import { Button, Input, Icons, Icon } from 'construct-ui';

interface IState {
  githubAccount: SocialAccount;
}

const GithubWell: m.Component<{}, IState> = {
  oninit: (vnode) => {
    vnode.state.githubAccount = app.login.socialAccounts.find((sa) => sa.provider === 'github');
  },
  view: (vnode) => {
    const { githubAccount } = vnode.state;
    return m('.GithubWell', [
      m('form', [
        m('h4', 'Github'),
        githubAccount && m(Input, {
          value: githubAccount?.username || '',
          contentLeft: m(Icon, { name: Icons.GITHUB }),
          disabled: true,
        }),
        m(Button, {
          label: githubAccount ? 'Unlink Account' : 'Link Account',
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
    ]);
  }
};

export default GithubWell;
