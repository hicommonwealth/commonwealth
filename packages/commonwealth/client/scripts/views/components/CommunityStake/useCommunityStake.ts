import { useQuery } from '@tanstack/react-query';

import {
  factoryContracts,
  STAKE_ID,
  ValidChains,
} from '@hicommonwealth/chains';
import { calculateVoteWeight } from '@hicommonwealth/chains/build/commonProtocol/utils';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import app from 'state';
import { useFetchCommunityStakeQuery } from 'state/api/communityStake';

interface UseCommunityStakeProps {
  communityId?: string;
  stakeId?: number;
}

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const { communityId, stakeId = STAKE_ID } = props;

  const communityStakes = new CommunityStakes(
    factoryContracts[ValidChains.Goerli].communityStake,
    factoryContracts[ValidChains.Goerli].factory,
  );
  const activeCommunityId = app?.chain?.id;
  const activeCommunityNamespace = app?.chain?.meta?.namespace;

  const { isInitialLoading: communityStakeLoading, data: stakeResponse } =
    useFetchCommunityStakeQuery({
      communityId: communityId || activeCommunityId,
      stakeId,
      apiEnabled: !!activeCommunityId,
    });

  const stakeData = stakeResponse?.data?.result;
  const stakeEnabled = stakeData?.stake_enabled;
  const apiEnabled = Boolean(stakeEnabled && !!activeCommunityNamespace);

  const {
    isInitialLoading: userStakeBalanceLoading,
    data: userStakeBalanceData,
  } = useQuery({
    queryKey: ['getUserStakeBalance', activeCommunityNamespace, STAKE_ID],
    queryFn: async () =>
      await communityStakes.getUserStakeBalance(
        activeCommunityNamespace,
        STAKE_ID,
      ),
    enabled: apiEnabled,
  });

  const { isInitialLoading: buyPriceDataLoading, data: buyPriceData } =
    useQuery({
      queryKey: [
        'getBuyPrice',
        activeCommunityNamespace,
        STAKE_ID,
        userStakeBalanceData,
      ],
      queryFn: () =>
        communityStakes.getBuyPrice(
          activeCommunityNamespace,
          STAKE_ID,
          Number(userStakeBalanceData),
        ),
      enabled: apiEnabled && !isNaN(Number(userStakeBalanceData)),
    });

  const voteWeight = calculateVoteWeight(
    userStakeBalanceData,
    stakeData?.stake_scaler,
  );
  const stakeBalance = Number(userStakeBalanceData);
  const stakeValue = stakeBalance * Number(buyPriceData?.price);
  const isLoading =
    communityStakeLoading || userStakeBalanceLoading || buyPriceDataLoading;

  return {
    stakeEnabled,
    stakeBalance,
    voteWeight,
    stakeValue,
    isLoading,
  };
};

export default useCommunityStake;
