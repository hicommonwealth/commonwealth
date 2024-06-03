import { GetThreadSubscriptions } from '@hicommonwealth/schemas';
import { useMemo } from 'react';
import { trpc } from 'utils/trpcClient';

/**
 * @deprecated TODO this is ALREADY deprecated because this is a workaround to
 * fix the problem with dates as strings and types being wrong. We need to fix
 * this once we fix types on the client.
 */
export function useThreadSubscriptions() {
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
