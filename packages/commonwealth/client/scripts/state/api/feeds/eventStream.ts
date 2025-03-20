import type { UseTRPCInfiniteQueryOptions } from '@trpc/react-query/shared';
import { trpc } from '../../../utils/trpcClient';

export const useFetchEventStreamQuery = (
  options?: UseTRPCInfiniteQueryOptions<
    'feed.getEventStream',
    { cursor: string | undefined },
    { items: { type: string; url: string; data?: any }[] },
    any
  >,
) => {
  // Use the built-in trpc hooks which handle proper query initialization
  return trpc.feed.getEventStream.useInfiniteQuery(
    { cursor: undefined },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchOnWindowFocus: true,
      ...options,
    },
  );
};
