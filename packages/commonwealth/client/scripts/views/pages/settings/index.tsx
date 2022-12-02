/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import app from 'state';

import 'pages/settings/index.scss';

import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { EmailSection } from './email_section';
import { LinkedAddressesSection } from './linked_addresses_section';
import { ComposerSection } from './composer_section';

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
