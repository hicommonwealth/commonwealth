/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'pages/settings/index.scss';
import app from 'state';

import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { ComposerSection } from './composer_section';
import { EmailSection } from './email_section';
import { LinkedAddressesSection } from './linked_addresses_section';

class SettingsPage extends ClassComponent {
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
