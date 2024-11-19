import { trpc } from 'utils/trpcClient';

const useCreateTokenTradeMutation = () => {
  return trpc.token.createLaunchpadTrade.useMutation();
};

export default useCreateTokenTradeMutation;
