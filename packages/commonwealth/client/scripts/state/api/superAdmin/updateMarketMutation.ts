import { trpc } from 'utils/trpcClient';

function useUpdateMarketMutation() {
  const utils = trpc.useUtils();

  return trpc.superAdmin.updateMarket.useMutation({
    onSuccess: () => {
      utils.community.getMarkets.invalidate();
    },
  });
}

export default useUpdateMarketMutation;
