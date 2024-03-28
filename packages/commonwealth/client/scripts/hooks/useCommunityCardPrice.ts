import ChainInfo from '../models/ChainInfo';
import StakeInfo from '../models/StakeInfo';
import { useGetBuyPriceQuery } from '../state/api/communityStake/index';
import { convertEthToUsd } from '../views/modals/ManageCommunityStakeModal/utils';

// I don't want to import web3 otherwise it will pull in bundle
function fromWei(value: string | null): number | null {
  if (!value) {
    return null;
  }
  return value / 10 ** 18;
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
  const communityStake: StakeInfo = community?.CommunityStakes?.find(
    (s) => s.stakeId === stakeId,
  );
  const stakeEnabled = !!communityStake?.stakeEnabled;

  // The price of buying one stake
  const { data: buyPriceData, isLoading } = useGetBuyPriceQuery({
    namespace: community.namespace,
    stakeId: stakeId,
    amount: 1,
    apiEnabled: stakeEnabled,
    chainRpc: community.ChainNode.url,
    ethChainId: community.ChainNode.ethChainId,
  });

  if (!stakeEnabled || isLoading) {
    return {
      stakeEnabled: false,
      stakeValue: '',
      stakeChange: 0,
    };
  }

  const stakeValue = convertEthToUsd(buyPriceData?.price, ethUsdRate);
  const historicalPriceEth = fromWei(historicalPrice);

  let stakeChange = 0;
  if (historicalPriceEth) {
    stakeChange =
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
