import { trpc } from 'utils/trpcClient';
import { invalidateAllQueriesForCommunity } from './getCommuityById';

export function useUpdateCommunityTags() {
  return trpc.community.updateCommunityTags.useMutation({
    onSuccess: async ({ community_id }) => {
      await invalidateAllQueriesForCommunity(community_id);
    },
  });
}
