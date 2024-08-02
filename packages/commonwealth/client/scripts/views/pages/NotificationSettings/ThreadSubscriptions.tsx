import { ThreadSubscription } from '@hicommonwealth/schemas';
import React, { useCallback, useState } from 'react';
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

  return (
    <>
      {(threadSubscriptions.data || [])
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
