import { trpc } from 'utils/trpcClient';

export function useGetApiKeyQuery() {
  return trpc.user.getApiKey.useQuery({});
}
