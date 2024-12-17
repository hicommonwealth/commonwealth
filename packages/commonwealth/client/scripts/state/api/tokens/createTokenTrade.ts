import { trpc } from 'utils/trpcClient';

const useCreateTokenTradeMutation = () => {
  return trpc.launchpadToken.createTrade.useMutation();
};

export default useCreateTokenTradeMutation;
