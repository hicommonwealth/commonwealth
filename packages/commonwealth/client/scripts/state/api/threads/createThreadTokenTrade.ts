import { trpc } from 'utils/trpcClient';

const useCreateThreadTokenTradeMutation = () => {
  return trpc.thread.createThreadTokenTrade.useMutation();
};

export default useCreateThreadTokenTradeMutation;
