import { trpc } from 'utils/trpcClient';

interface UseDeletePollMutationProps {
  threadId: number;
}

const useDeletePollMutation = ({ threadId }: UseDeletePollMutationProps) => {
  const utils = trpc.useUtils();
  return trpc.poll.deletePoll.useMutation({
    onSuccess: () => {
      utils.poll.getPolls
        .invalidate({ thread_id: threadId })
        .catch(console.error);
    },
  });
};

export default useDeletePollMutation;
