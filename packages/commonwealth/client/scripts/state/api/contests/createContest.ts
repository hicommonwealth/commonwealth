import { trpc } from 'utils/trpcClient';

const useCreateContestMutation = () => {
  return trpc.contest.createContestMetadata.useMutation();
};

export default useCreateContestMutation;
