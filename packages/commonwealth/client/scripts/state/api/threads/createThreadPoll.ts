import { trpc } from 'utils/trpcClient';

const utils = trpc.useUtils();

const useCreateThreadPollMutation = () => {
  return trpc.poll.createPoll.useMutation({
    onSuccess: async (data) => {
      utils.poll.getPolls
        .invalidate({ thread_id: data.thread_id })
        .catch(console.error);
    },
  });
};

export default useCreateThreadPollMutation;
