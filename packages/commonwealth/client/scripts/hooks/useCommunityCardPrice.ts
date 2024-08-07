import ChainInfo from '../models/ChainInfo';
import StakeInfo from '../models/StakeInfo';
import { useGetBuyPriceQuery } from '../state/api/communityStake/index';
import { convertEthToUsd } from '../views/modals/ManageCommunityStakeModal/utils';

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
  community: ChainInfo;
  stakeId: number;
  ethUsdRate: string;
  historicalPrice: string;
}) => {
  // @ts-expect-error StrictNullChecks
  const communityStake: StakeInfo = community?.CommunityStakes?.find(
    (s) => s.stakeId === stakeId,
  );
  const stakeEnabled = !!communityStake?.stakeEnabled;

  // The price of buying one stake
  const { data: buyPriceData, isLoading } = useGetBuyPriceQuery({
    // @ts-expect-error StrictNullChecks
    namespace: community.namespace,
    stakeId: stakeId,
    amount: 1,
    apiEnabled: stakeEnabled,
    chainRpc: community.ChainNode?.url,
    // @ts-expect-error StrictNullChecks
    ethChainId: community.ChainNode?.ethChainId,
  });

  if (!stakeEnabled || isLoading) {
    return {
      stakeEnabled: false,
      stakeValue: '',
      stakeChange: 0,
    };
  }

  // @ts-expect-error StrictNullChecks
  const stakeValue = convertEthToUsd(buyPriceData?.price, ethUsdRate);
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
