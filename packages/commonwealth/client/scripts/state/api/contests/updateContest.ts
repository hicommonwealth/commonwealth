import { trpc } from 'utils/trpcClient';

const useUpdateContestMutation = () => {
  return trpc.contest.updateContestMetadata.useMutation();
};

export default useUpdateContestMutation;
