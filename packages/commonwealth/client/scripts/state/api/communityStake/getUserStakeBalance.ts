import { commonProtocol } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import { ContractMethods } from 'state/api/config';
import { lazyLoadCommunityStakes } from '../../../helpers/ContractHelpers/LazyCommunityStakes';

const GET_USER_STAKE_BALANCE_STALE_TIME = 5 * 1_000; // 5 sec

type GetUserStakeBalanceProps = Omit<
  UseGetUserStakeBalanceQueryProps,
  'apiEnabled'
>;

const getUserStakeBalance = async ({
  namespace,
  stakeId,
  chainRpc,
  walletAddress,
}: GetUserStakeBalanceProps) => {
  const CommunityStakes = await lazyLoadCommunityStakes();
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[
      commonProtocol.ValidChains.Base
    ].communityStake,
    commonProtocol.factoryContracts[commonProtocol.ValidChains.Base].factory,
    chainRpc,
  );

  return await communityStakes.getUserStakeBalance(
    namespace,
    stakeId,
    walletAddress,
  );
};

interface UseGetUserStakeBalanceQueryProps {
  namespace: string;
  stakeId: number;
  apiEnabled: boolean;
  chainRpc: string;
  walletAddress: string;
  keepPreviousData?: boolean;
}

const useGetUserStakeBalanceQuery = ({
  namespace,
  stakeId,
  apiEnabled,
  chainRpc,
  walletAddress,
  keepPreviousData = false,
}: UseGetUserStakeBalanceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_USER_STAKE_BALANCE,
      namespace,
      stakeId,
      chainRpc,
      walletAddress,
    ],
    queryFn: () =>
      getUserStakeBalance({ namespace, stakeId, chainRpc, walletAddress }),
    staleTime: GET_USER_STAKE_BALANCE_STALE_TIME,
    enabled: apiEnabled,
    keepPreviousData,
  });
};

export default useGetUserStakeBalanceQuery;
