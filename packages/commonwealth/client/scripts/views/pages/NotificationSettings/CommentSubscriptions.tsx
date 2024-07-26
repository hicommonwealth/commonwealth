import { CommentSubscription } from '@hicommonwealth/schemas';
import React, { useCallback, useState } from 'react';
import { CommentSubscriptionEntry } from 'views/pages/NotificationSettings/CommentSubscriptionEntry';
import { useCommentSubscriptions } from 'views/pages/NotificationSettings/useCommentSubscriptions';
import { z } from 'zod';

export const CommentSubscriptions = () => {
  const commentSubscriptions = useCommentSubscriptions();
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
      {(commentSubscriptions.data || [])
        .filter((current) => current.Comment)
        .filter((current) => !threadsFilter.includes(current.Comment!.id!))
        .map((current) => (
          <CommentSubscriptionEntry
            key={current.Comment!.id!}
            subscription={current as z.infer<typeof CommentSubscription>}
            onUnsubscribe={handleUnsubscribe}
          />
        ))}
    </>
  );
};
