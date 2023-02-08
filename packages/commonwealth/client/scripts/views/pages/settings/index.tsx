/* @jsx jsx */
import React from 'react';

import { ClassComponent, setRoute, jsx } from 'mithrilInterop';

import 'pages/settings/index.scss';
import app from 'state';

import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { ComposerSection } from './composer_section';
import { EmailSection } from './email_section';
import { LinkedAddressesSection } from './linked_addresses_section';
import withRouter from 'navigation/helpers';

class SettingsPageComponent extends ClassComponent {
  view() {
    if (app.loginStatusLoaded() && !app.isLoggedIn()) {
      // TODO add additional params like "replace", see AdminPageComponent
      this.setRoute('/', {}, { replace: true });
      return <PageLoading />;
    }
    if (!app.loginStatusLoaded()) return <PageLoading />;

    return (
      <Sublayout
      // title="Account Settings"
      >
        <div className="SettingsPage">
          <EmailSection />
          <LinkedAddressesSection />
          <ComposerSection />
        </div>
      </Sublayout>
    );
  }
}

const SettingsPage = withRouter(SettingsPageComponent);

export default SettingsPage;
