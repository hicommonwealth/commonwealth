import { useFlag } from 'hooks/useFlag';
import 'pages/notifications/index.scss';
import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import PageError from 'views/pages/error';
import { KnockNotificationsContent } from 'views/pages/notifications/KnockNotificationsContent';
import { LegacyNotificationsContent } from 'views/pages/notifications/LegacyNotificationsContent';

const NotificationsPage = () => {
  const enableKnockInAppNotifications = useFlag('knockInAppNotifications');

  if (!app.isLoggedIn()) {
    return <PageError message="This page requires you to be signed in." />;
  }

  return (
    <CWPageLayout>
      {!enableKnockInAppNotifications && <LegacyNotificationsContent />}
      {enableKnockInAppNotifications && <KnockNotificationsContent />}
    </CWPageLayout>
  );
};

export default NotificationsPage;
