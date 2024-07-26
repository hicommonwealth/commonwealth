import { GetCommentSubscriptions } from '@hicommonwealth/schemas';
import { useCommentSubscriptionsQuery } from 'client/scripts/state/api/trpc/subscription/useCommentSubscriptionsQuery';
import { useMemo } from 'react';

/**
 * @deprecated TODO this is ALREADY deprecated because this is a workaround to
 * fix the problem with dates as strings and types being wrong. We need to fix
 * this once we fix types on the client.
 */
export function useThreadSubscriptions() {
  const subscriptionsQuery = useCommentSubscriptionsQuery();

  return useMemo(() => {
    return {
      ...subscriptionsQuery,
      data: subscriptionsQuery.data
        ? GetCommentSubscriptions.output.parse(subscriptionsQuery.data)
        : subscriptionsQuery.data,
    };
  }, [subscriptionsQuery]);
}
