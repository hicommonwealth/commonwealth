import { ApiEndpoints, queryClient } from 'state/api/config';
import { trpc } from 'utils/trpcClient';

const useVotePollMutation = ({ threadId }: { threadId: number }) => {
  return trpc.poll.createPollVote.useMutation({
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.fetchThreadPolls(threadId), data.community_id],
      });
    },
  });
};

export default useVotePollMutation;
