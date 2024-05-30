import {
  GetThreadSubscriptions,
  ThreadSubscription,
} from '@hicommonwealth/schemas';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/notification_settings/index.scss';
import React, { useCallback, useMemo, useState } from 'react';
import app from 'state';
import { trpc } from 'utils/trpcClient';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { SubEntry } from 'views/pages/notification_settings2/SubEntry';
import { z } from 'zod';
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

  const [threadsFilter, setThreadsFilter] = useState<readonly number[]>([]);

  const handleUnsubscribe = useCallback(
    (id: number) => {
      setThreadsFilter([...threadsFilter, id]);
    },
    [threadsFilter],
  );

  if (threadSubscriptions.isLoading) {
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
          .filter((current) => !threadsFilter.includes(current.Thread.id))
          .map((current) => (
            <SubEntry
              key={current.Thread.id}
              subscription={current as z.infer<typeof ThreadSubscription>}
              onUnsubscribe={handleUnsubscribe}
            />
          ))}
      </div>
    </CWPageLayout>
  );
};

export default Index;
