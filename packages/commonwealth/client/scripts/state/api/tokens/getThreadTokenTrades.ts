import { trpc } from 'utils/trpcClient';

export const useGetThreadTokenTradesQuery = (
  input: Parameters<typeof trpc.thread.getThreadTokenTrades.useQuery>[0],
  options?: Parameters<typeof trpc.thread.getThreadTokenTrades.useQuery>[1],
) => {
  return trpc.thread.getThreadTokenTrades.useQuery(input, options);
};
