import 'pages/notifications/index.scss';
import React from 'react';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import PageError from 'views/pages/error';
import { KnockNotificationsContent } from 'views/pages/notifications/KnockNotificationsContent';

const NotificationsPage = () => {
  const user = useUserStore();

  if (!user.isLoggedIn) {
    return <PageError message="This page requires you to be signed in." />;
  }

  return (
    <CWPageLayout>
      <KnockNotificationsContent />
    </CWPageLayout>
  );
};

export default NotificationsPage;
