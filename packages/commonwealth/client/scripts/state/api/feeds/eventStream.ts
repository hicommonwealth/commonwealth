import { trpc } from '../../../utils/trpcClient';

export const useFetchEventStreamQuery = (
  options?: Parameters<typeof trpc.feed.getEventStream.useInfiniteQuery>[1],
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
