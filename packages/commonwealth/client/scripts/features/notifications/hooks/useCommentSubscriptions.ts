import { GetCommentSubscriptions } from '@hicommonwealth/schemas';
import { useMemo } from 'react';
import { useCommentSubscriptionsQuery } from 'state/api/trpc/subscription/useCommentSubscriptionsQuery';

export function useCommentSubscriptions() {
  const subscriptionsQuery = useCommentSubscriptionsQuery();

  // TODO this a workaround to fix the problem with dates as strings and types
  // being wrong. We need to fix this once we fix types on the client.
  //
  // https://github.com/hicommonwealth/commonwealth/issues/7866

  return useMemo(() => {
    return {
      ...subscriptionsQuery,
      data: subscriptionsQuery.data
        ? GetCommentSubscriptions.output.parse(subscriptionsQuery.data)
        : subscriptionsQuery.data,
    };
  }, [subscriptionsQuery]);
}
