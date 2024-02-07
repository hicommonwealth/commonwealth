import { commonProtocol } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods } from 'state/api/config';

const GET_USER_ETH_BALANCE_STALE_TIME = 60 * 1_000; // 1 min

type GetUserEthBalanceProps = Omit<
  UseGetUserEthBalanceQueryProps,
  'apiEnabled'
>;

const getUserEthBalance = async ({
  chainRpc,
  walletAddress,
}: GetUserEthBalanceProps) => {
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[
      commonProtocol.ValidChains.Sepolia
    ].communityStake,
    commonProtocol.factoryContracts[commonProtocol.ValidChains.Sepolia].factory,
    chainRpc,
  );

  return await communityStakes.getUserEthBalance(walletAddress);
};

interface UseGetUserEthBalanceQueryProps {
  chainRpc: string;
  walletAddress: string;
  apiEnabled: boolean;
}

const useGetUserEthBalanceQuery = ({
  chainRpc,
  walletAddress,
  apiEnabled,
}: UseGetUserEthBalanceQueryProps) => {
  return useQuery({
    queryKey: [ContractMethods.GET_USER_ETH_BALANCE, chainRpc, walletAddress],
    queryFn: () => getUserEthBalance({ chainRpc, walletAddress }),
    staleTime: GET_USER_ETH_BALANCE_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useGetUserEthBalanceQuery;
