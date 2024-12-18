import { trpc } from 'utils/trpcClient';
import { clearThreadCache } from '../threads/helpers/cache';

const useToggleArchiveTopicMutation = () => {
  const utils = trpc.useUtils();
  return trpc.community.toggleArchiveTopic.useMutation({
    onSuccess: async (response) => {
      await utils.community.getTopics.invalidate({
        community_id: response.community_id,
      });

      // since this is an admin action, it only affects 1 user (the admin), clear cache
      clearThreadCache(response.community_id);
    },
  });
};

export default useToggleArchiveTopicMutation;
