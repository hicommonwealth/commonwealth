import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { trpc } from 'utils/trpcClient';

const useRefreshWeightedVotesMutation = () => {
  const utils = trpc.useUtils();
  return trpc.community.refreshWeightedVotes.useMutation({
    onSuccess: async (response) => {
      await utils.community.getTopics.invalidate({
        community_id: response.community_id,
      });

      await utils.thread.getThreads.invalidate({
        community_id: response.community_id,
      });

      notifySuccess('Vote weights recalculation completed successfully');
    },
    onError: (error) => {
      console.error('Failed to refresh weighted votes:', error);
      notifyError('Failed to recalculate vote weights');
    },
  });
};

export default useRefreshWeightedVotesMutation;
