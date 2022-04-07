/* @jsx m */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import 'pages/settings/index.scss';

import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import EmailWell from './email_well';
import LinkedAddressesWell from './linked_addresses_well';
import SettingsWell from './settings_well';

class SettingsPage implements m.ClassComponent {
  oncreate() {
    mixpanel.track('PageVisit', { 'Page Name': 'SettingsPage' });
  }

  view() {
    if (app.loginStatusLoaded() && !app.isLoggedIn()) {
      m.route.set('/', {}, { replace: true });
      return <PageLoading />;
    }
    if (!app.loginStatusLoaded()) return <PageLoading />;

    return (
      <Sublayout title="Account Settings">
        <div class="SettingsPage">
          {m(EmailWell, { github: true })}
          <br />
          {m(LinkedAddressesWell)}
          <br />
          {m(SettingsWell)}
        </div>
      </Sublayout>
    );
  }
}

export default SettingsPage;
