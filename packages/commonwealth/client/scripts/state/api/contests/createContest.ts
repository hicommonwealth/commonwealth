import { trpc } from 'utils/trpcClient';

const useCreateContestMutation = () => {
  const utils = trpc.useUtils();

  return trpc.contest.createContestMetadata.useMutation({
    onSuccess: async () => {
      await utils.contest.getAllContests.invalidate();
    },
  });
};

export default useCreateContestMutation;
