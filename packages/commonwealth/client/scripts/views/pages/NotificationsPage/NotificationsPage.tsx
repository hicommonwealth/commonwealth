import 'pages/notifications/index.scss';
import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { KnockContent } from 'views/pages/NotificationsPage/KnockContent';
import PageError from 'views/pages/error';
import { CWText } from '../../components/component_kit/cw_text';

export const NotificationsPage = () => {
  if (!app.isLoggedIn()) {
    return <PageError message="This page requires you to be signed in." />;
  }

  return (
    <CWPageLayout>
      <div className="NotificationsPage">
        <CWText type="h2" fontWeight="medium">
          Notifications
        </CWText>

        <KnockContent />
      </div>
    </CWPageLayout>
  );
};

export default NotificationsPage;
