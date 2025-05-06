import { trpc } from 'utils/trpcClient';

const utils = trpc.useUtils();

const useVotePollMutation = ({ threadId }: { threadId: number }) => {
  return trpc.poll.createPollVote.useMutation({
    onSuccess: async () => {
      await utils.poll.getPolls.invalidate({ thread_id: threadId });
    },
  });
};

export default useVotePollMutation;
