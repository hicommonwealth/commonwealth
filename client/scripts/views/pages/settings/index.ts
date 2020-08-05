import 'pages/settings/index.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { notifyInfo } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import EmailWell from './email_well';
import AccountsWell from './accounts_well';
import SettingsWell from './settings_well';
import MergeAccountsWell from './merge_accounts_well';

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
          m(EmailWell, { github: true }),
          m('br'),
          m(SettingsWell),
          m(MergeAccountsWell),
        ])
    ]);
  }
};

export default SettingsPage;
