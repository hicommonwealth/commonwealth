import 'pages/settings/index.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { notifyInfo } from 'controllers/app/notifications';

import PageLoading from 'views/pages/loading';
import Sublayout from 'views/sublayout';

import EmailWell from './email_well';
import LinkedAddressesWell from './linked_addresses_well';
import SettingsWell from './settings_well';

const SettingsPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'SettingsPage' });
  },
  view: (vnode) => {
    if (app.loginStatusLoaded() && !app.isLoggedIn()) {
      m.route.set('/', {}, { replace: true });
      return m(PageLoading);
    }
    if (!app.loginStatusLoaded()) return m(PageLoading);

    return m(Sublayout, {
      class: 'SettingsPage',
      title: 'Login & Address Settings',
    }, [
      m('br'),
      m(EmailWell, { github: true }),
      m('br'),
      m(LinkedAddressesWell),
      m('br'),
      m(SettingsWell),
    ]);
  }
};

export default SettingsPage;
