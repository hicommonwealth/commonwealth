import { commonProtocol } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import { ContractMethods } from 'state/api/config';
import { lazyLoadCommunityStakes } from '../../../helpers/ContractHelpers/LazyCommunityStakes';

const GET_USER_ETH_BALANCE_STALE_TIME = 60 * 1_000; // 1 min

type GetUserEthBalanceProps = Omit<
  UseGetUserEthBalanceQueryProps,
  'apiEnabled'
>;

const getUserEthBalance = async ({
  chainRpc,
  walletAddress,
  ethChainId,
}: GetUserEthBalanceProps) => {
  const CommunityStakes = await lazyLoadCommunityStakes();
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[ethChainId].communityStake,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await communityStakes.getUserEthBalance(walletAddress);
};

interface UseGetUserEthBalanceQueryProps {
  chainRpc: string;
  walletAddress: string;
  apiEnabled: boolean;
  ethChainId: number;
}

const useGetUserEthBalanceQuery = ({
  chainRpc,
  walletAddress,
  apiEnabled,
  ethChainId,
}: UseGetUserEthBalanceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_USER_ETH_BALANCE,
      chainRpc,
      walletAddress,
      ethChainId,
    ],
    queryFn: () => getUserEthBalance({ chainRpc, walletAddress, ethChainId }),
    staleTime: GET_USER_ETH_BALANCE_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useGetUserEthBalanceQuery;
