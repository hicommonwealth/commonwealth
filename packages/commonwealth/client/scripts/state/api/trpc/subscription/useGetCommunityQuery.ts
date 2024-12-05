import { trpc } from 'utils/trpcClient';

export function useGetCommunityQuery() {
  return trpc.community.getCommunities;
}
