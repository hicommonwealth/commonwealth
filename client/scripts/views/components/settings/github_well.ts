import 'components/settings/settings_well.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { SocialAccount } from 'models';
import { Button } from 'construct-ui';

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
        m('input[type="text"]', {
          value: githubAccount.username || 'None',
        }),
        m(Button, {
          label: githubAccount ? 'Unlink Account' : 'Link Account',
          href: githubAccount ? '#' : `${app.serverUrl()}/auth/github`,
          onclick: () => {
            if (githubAccount) {
              $.post(`${app.serverUrl()}/deleteGithubAccount`, { jwt: app.login.jwt }).then((response) => {
                if (response.status === 'Success') vnode.state.githubAccount = null;
              }).catch((err: any) => {
                console.dir(err);
                m.redraw();
              });
            } else {
              localStorage.setItem('githubPostAuthRedirect', JSON.stringify({
                timestamp: (+new Date()).toString(),
                path: m.route.get()
              }));
            }
          },
        })
      ]),
    ]);
  }
};

export default GithubWell;
