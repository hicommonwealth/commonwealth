import { GetCommentSubscriptions } from '@hicommonwealth/schemas';
import { useCommentSubscriptionsQuery } from 'client/scripts/state/api/trpc/subscription/useCommentSubscriptionsQuery';
import { useMemo } from 'react';

export function useCommentSubscriptions() {
  const subscriptionsQuery = useCommentSubscriptionsQuery();

  // TODO this a workaround to fix the problem with dates as strings and types
  // being wrong. We need to fix this once we fix types on the client.
  return useMemo(() => {
    return {
      ...subscriptionsQuery,
      data: subscriptionsQuery.data
        ? GetCommentSubscriptions.output.parse(subscriptionsQuery.data)
        : subscriptionsQuery.data,
    };
  }, [subscriptionsQuery]);
}
