import { trpc } from 'utils/trpcClient';

const useCreateThreadPollMutation = () => {
  const utils = trpc.useUtils();
  return trpc.poll.createPoll.useMutation({
    onSuccess: (data) => {
      utils.poll.getPolls
        .invalidate({ thread_id: data.thread_id })
        .catch(console.error);
    },
  });
};

export default useCreateThreadPollMutation;
