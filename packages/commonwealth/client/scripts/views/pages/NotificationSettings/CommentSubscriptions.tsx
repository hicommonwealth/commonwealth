import { CommentSubscription } from '@hicommonwealth/schemas';
import React, { useCallback, useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
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

  const data = commentSubscriptions.data || [];

  if (!data.length) {
    return (
      <CWText type="h4" fontWeight="semiBold" className="error-content">
        No comment subscriptions.
      </CWText>
    );
  }
  return (
    <>
      {data
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
