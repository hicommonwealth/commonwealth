import { trpc } from 'utils/trpcClient';

const useCancelContestMutation = () => {
  return trpc.contest.cancelContestMetadata.useMutation();
};

export default useCancelContestMutation;
