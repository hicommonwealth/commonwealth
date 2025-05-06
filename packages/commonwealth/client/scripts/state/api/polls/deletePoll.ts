import { trpc } from 'utils/trpcClient';

interface UseDeletePollMutationProps {
  threadId: number;
}

const utils = trpc.useUtils();

const useDeletePollMutation = ({ threadId }: UseDeletePollMutationProps) => {
  return trpc.poll.deletePoll.useMutation({
    onSuccess: async () => {
      utils.poll.getPolls
        .invalidate({ thread_id: threadId })
        .catch(console.error);
    },
  });
};

export default useDeletePollMutation;
