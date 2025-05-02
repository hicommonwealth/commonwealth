import { trpc } from 'utils/trpcClient';

const useDeleteContestMutation = () => {
  const utils = trpc.useUtils();

  return trpc.contest.deleteContestMetadata.useMutation({
    onSuccess: async () => {
      await utils.contest.getAllContests.invalidate();
    },
  });
};

export default useDeleteContestMutation;
