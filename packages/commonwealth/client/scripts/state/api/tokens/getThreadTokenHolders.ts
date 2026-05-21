import { trpc } from '../../../utils/trpcClient';

export const useGetThreadTokenHoldersQuery = (
  params: { thread_id: number },
  options?: { enabled?: boolean },
) => {
  return trpc.thread.getThreadTokenHolders.useQuery(params, {
    enabled: options?.enabled ?? true,
  });
};
