import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { useQuery } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods } from 'state/api/config';

const GET_USER_ETH_BALANCE_STALE_TIME = 60 * 1_000; // 1 min

const getUserEthBalance = async () => {
  const communityStakes = new CommunityStakes(
    factoryContracts[ValidChains.Goerli].communityStake,
    factoryContracts[ValidChains.Goerli].factory,
  );

  return await communityStakes.getUserEthBalance();
};

const useGetUserEthBalanceQuery = () => {
  return useQuery({
    queryKey: [ContractMethods.GET_USER_ETH_BALANCE],
    queryFn: getUserEthBalance,
    staleTime: GET_USER_ETH_BALANCE_STALE_TIME,
  });
};

export default useGetUserEthBalanceQuery;
