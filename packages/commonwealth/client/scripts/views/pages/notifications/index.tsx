import { useFlag } from 'hooks/useFlag';
import 'pages/notifications/index.scss';
import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import PageError from 'views/pages/error';
import { KnockContent } from 'views/pages/notifications/KnockContent';
import { OldContent } from 'views/pages/notifications/OldContent';
import { CWText } from '../../components/component_kit/cw_text';

const NotificationsPage = () => {
  const enableKnockInAppNotifications = useFlag('knockInAppNotifications');

  if (!app.isLoggedIn()) {
    return <PageError message="This page requires you to be signed in." />;
  }

  return (
    <CWPageLayout>
      <div className="NotificationsPage">
        <CWText type="h2" fontWeight="medium">
          Notifications
        </CWText>

        {enableKnockInAppNotifications && <KnockContent />}
        {!enableKnockInAppNotifications && <OldContent />}
      </div>
    </CWPageLayout>
  );
};

export default NotificationsPage;
