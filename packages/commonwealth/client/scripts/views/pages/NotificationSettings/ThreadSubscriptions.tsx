import { ThreadSubscription } from '@hicommonwealth/schemas';
import React, { useCallback, useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { ThreadSubscriptionEntry } from 'views/pages/NotificationSettings/ThreadSubscriptionEntry';
import { useThreadSubscriptions } from 'views/pages/NotificationSettings/useThreadSubscriptions';
import { z } from 'zod';

export const ThreadSubscriptions = () => {
  const threadSubscriptions = useThreadSubscriptions();
  // do not show these threads because they've been delete so it avoids us
  // having to do a refresh
  const [threadsFilter, setThreadsFilter] = useState<readonly number[]>([]);

  const handleUnsubscribe = useCallback(
    (id: number) => {
      setThreadsFilter([...threadsFilter, id]);
    },
    [threadsFilter],
  );

  const data = threadSubscriptions.data || [];

  if (!data.length) {
    return (
      <CWText type="h4" fontWeight="semiBold" className="error-content">
        No thread subscriptions.
      </CWText>
    );
  }
  return (
    <>
      {data
        .filter((current) => current.Thread)
        .filter((current) => !threadsFilter.includes(current.Thread!.id!))
        .map((current) => (
          <ThreadSubscriptionEntry
            key={current.Thread!.id!}
            subscription={current as z.infer<typeof ThreadSubscription>}
            onUnsubscribe={handleUnsubscribe}
          />
        ))}
    </>
  );
};
