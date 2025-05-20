import { trpc } from 'utils/trpcClient';

const useVotePollMutation = ({ threadId }: { threadId: number }) => {
  const utils = trpc.useUtils();
  return trpc.poll.createPollVote.useMutation({
    onSuccess: async () => {
      await utils.poll.getPolls.invalidate({ thread_id: threadId });
    },
  });
};

export default useVotePollMutation;
