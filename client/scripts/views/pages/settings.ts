import 'pages/settings.scss';

import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';
import app from 'state';

import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { notifyInfo } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import AccountsWell from 'views/components/settings/accounts_well';
import SettingsWell from 'views/components/settings/settings_well';
import SendEDGWell from 'views/components/settings/send_edg_well';
import GithubWell from 'views/components/settings/github_well';

const SettingsPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'SettingsPage' });
  },
  view: (vnode) => {
    if (app.loginStatusLoaded() && !app.isLoggedIn()) {
      m.route.set('/', {}, { replace: true });
      return;
    }
    return m(Sublayout, {
      class: 'SettingsPage',
    }, [
      !app.loginStatusLoaded()
        ? m('.forum-container', 'Loading...')
        : m('.forum-container', [
          m('h2.page-title', 'Settings'),
          m(SettingsWell),
          m(GithubWell),
          m(AccountsWell),
          !app.community && app.vm.activeAccount && app.vm.activeAccount instanceof SubstrateAccount
            && m(SendEDGWell, { sender: app.vm.activeAccount }),
        ])
    ]);
  }
};

export default SettingsPage;
