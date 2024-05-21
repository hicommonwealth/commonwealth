import { GetThreadSubscriptions } from '@hicommonwealth/schemas';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/notification_settings/index.scss';
import React, { useMemo } from 'react';
import app from 'state';
import { trpc } from 'utils/trpcClient';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { SubEntry } from 'views/pages/notification_settings2/SubEntry';
import { CWText } from '../../components/component_kit/cw_text';
import { PageLoading } from '../loading';
import './index.scss';

function useThreadSubscriptions() {
  const threadSubscriptions = trpc.subscription.getThreadSubscriptions.useQuery(
    {},
  );

  return useMemo(() => {
    return {
      ...threadSubscriptions,
      data: threadSubscriptions.data
        ? GetThreadSubscriptions.output.parse(threadSubscriptions.data)
        : threadSubscriptions.data,
    };
  }, [threadSubscriptions]);
}

const Index = () => {
  const navigate = useCommonNavigate();
  const threadSubscriptions = useThreadSubscriptions();

  if (!threadSubscriptions.data) {
    return <PageLoading />;
  } else if (!app.isLoggedIn()) {
    navigate('/', { replace: true });
    return <PageLoading />;
  }

  return (
    <CWPageLayout>
      <div className="NotificationSettingsPage NotificationSettingsPage2">
        <CWText type="h3" fontWeight="semiBold" className="page-header-text">
          Notification settings
        </CWText>
        <CWText className="page-subheader-text">
          Manage the emails and alerts you receive about your activity
        </CWText>

        {(threadSubscriptions.data || [])
          .filter((current) => current.Thread)
          .map((current) => (
            <SubEntry key={current.id} thread={current.Thread} />
          ))}
      </div>
    </CWPageLayout>
  );
};

export default Index;
