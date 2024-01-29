import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { useQuery } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods } from 'state/api/config';

const GET_USER_STAKE_BALANCE_STALE_TIME = 5 * 1_000; // 5 sec

type GetUserStakeBalanceProps = Omit<
  UseGetUserStakeBalanceQueryProps,
  'apiEnabled'
>;

const getUserStakeBalance = async ({
  namespace,
  stakeId,
}: GetUserStakeBalanceProps) => {
  const communityStakes = new CommunityStakes(
    factoryContracts[ValidChains.Goerli].communityStake,
    factoryContracts[ValidChains.Goerli].factory,
  );

  return await communityStakes.getUserStakeBalance(namespace, stakeId);
};

interface UseGetUserStakeBalanceQueryProps {
  namespace: string;
  stakeId: number;
  apiEnabled: boolean;
}

const useGetUserStakeBalanceQuery = ({
  namespace,
  stakeId,
  apiEnabled,
}: UseGetUserStakeBalanceQueryProps) => {
  return useQuery({
    queryKey: [ContractMethods.GET_USER_STAKE_BALANCE, namespace, stakeId],
    queryFn: () => getUserStakeBalance({ namespace, stakeId }),
    staleTime: GET_USER_STAKE_BALANCE_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useGetUserStakeBalanceQuery;
