import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { useGetBuyPriceQuery } from '../state/api/communityStake/index';
import { convertTokenAmountToUsd } from '../views/modals/ManageCommunityStakeModal/utils';

// I don't want to import web3 otherwise it will pull in bundle
function fromWei(value: string | null): number | null {
  if (!value) {
    return null;
  }
  return parseFloat(value) / 10 ** 18;
}

export const useCommunityCardPrice = ({
  community,
  stakeId,
  ethUsdRate,
  historicalPrice,
}: {
  community: z.infer<typeof ExtendedCommunity>;
  stakeId: number;
  ethUsdRate: string;
  historicalPrice: string;
}) => {
  const communityStake = (community?.CommunityStakes || [])?.find(
    (s) => s.stake_id === stakeId,
  );
  const stakeEnabled = !!communityStake?.stake_enabled;

  // The price of buying one stake
  const { data: buyPriceData, isLoading } = useGetBuyPriceQuery({
    namespace: community?.namespace || '',
    stakeId: stakeId,
    amount: 1,
    apiEnabled: stakeEnabled && !!community,
    chainRpc: community?.ChainNode?.url || '',
    ethChainId: community?.ChainNode?.eth_chain_id || 0,
  });

  if (!stakeEnabled || isLoading) {
    return {
      stakeEnabled: false,
      stakeValue: '',
      stakeChange: 0,
    };
  }

  // @ts-expect-error StrictNullChecks
  const stakeValue = convertTokenAmountToUsd(buyPriceData?.price, ethUsdRate);
  const historicalPriceEth = fromWei(historicalPrice);

  let stakeChange = 0;
  if (historicalPriceEth) {
    stakeChange =
      // @ts-expect-error StrictNullChecks
      ((parseFloat(buyPriceData?.price) - historicalPriceEth) /
        historicalPriceEth) *
      100;
  }

  return {
    stakeEnabled,
    stakeValue,
    stakeChange,
  };
};
