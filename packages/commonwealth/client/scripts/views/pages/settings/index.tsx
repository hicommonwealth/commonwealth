import React from 'react';

import 'pages/settings/index.scss';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { ComposerSection } from './composer_section';
import { EmailSection } from './email_section';
import { LinkedAddressesSection } from './linked_addresses_section';
import { useCommonNavigate } from 'navigation/helpers';

const SettingsPage = () => {
  const navigate = useCommonNavigate();

  if (app.loginStatusLoaded() && !app.isLoggedIn()) {
    navigate('/', { replace: true });
    return <PageLoading />;
  }

  if (!app.loginStatusLoaded()) return <PageLoading />;

  return (
    <Sublayout>
      <div className="SettingsPage">
        <EmailSection />
        <LinkedAddressesSection />
        <ComposerSection />
      </div>
    </Sublayout>
  );
};

export default SettingsPage;
