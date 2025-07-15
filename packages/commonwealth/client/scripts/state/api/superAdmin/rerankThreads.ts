import { trpc } from 'utils/trpcClient';

const useRerankThreadsMutation = () => {
  return trpc.superAdmin.rerankThreads.useMutation({});
};

export default useRerankThreadsMutation;
