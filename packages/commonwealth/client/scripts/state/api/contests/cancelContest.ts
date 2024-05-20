import { trpc } from 'utils/trpcClient';

const useCancelContestMutation = () => {
  const utils = trpc.useUtils();

  return trpc.contest.cancelContestMetadata.useMutation({
    onSuccess: async () => {
      await utils.contest.getAllContests.invalidate();
    },
  });
};

export default useCancelContestMutation;
