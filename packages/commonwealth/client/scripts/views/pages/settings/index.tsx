/* @jsx m */

import m from 'mithril';
import app from 'state';

import 'pages/settings/index.scss';

import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { EmailSection } from './email_section';
import { LinkedAddressesSection } from './linked_addresses_section';
import { ComposerSection } from './composer_section';

class SettingsPage implements m.ClassComponent {
  view() {
    if (app.loginStatusLoaded() && !app.isLoggedIn()) {
      m.route.set('/', {}, { replace: true });
      return <PageLoading />;
    }
    if (!app.loginStatusLoaded()) return <PageLoading />;

    return (
      <Sublayout
      // title="Account Settings"
      >
        <div class="SettingsPage">
          <EmailSection />
          <LinkedAddressesSection />
          <ComposerSection />
        </div>
      </Sublayout>
    );
  }
}

export default SettingsPage;
