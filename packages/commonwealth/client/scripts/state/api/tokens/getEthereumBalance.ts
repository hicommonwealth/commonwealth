import { useQuery } from '@tanstack/react-query';
import Web3 from 'web3';

const ETH_BALANCE_STALE_TIME = 60 * 1_000; // 1 min

interface UseGetEthereumBalanceQueryProps {
  userAddress: string;
  rpcProvider: any;
  enabled?: boolean;
}

export const getEthereumBalance = async ({
  userAddress,
  rpcProvider,
}: Omit<UseGetEthereumBalanceQueryProps, 'enabled'>) => {
  const web3 = new Web3(rpcProvider);
  const balance = await web3.eth.getBalance(userAddress);
  const formattedBalance = web3.utils.fromWei(balance, 'ether');

  return formattedBalance === '0.' ? '0' : formattedBalance;
};

export const getEthereumBalanceQueryKey = (
  params: Omit<UseGetEthereumBalanceQueryProps, 'enabled'>,
) => ['ethereum-balance', params.userAddress];

const useGetEthereumBalanceQuery = ({
  userAddress,
  rpcProvider,
  enabled = true,
}: UseGetEthereumBalanceQueryProps) => {
  return useQuery({
    queryKey: getEthereumBalanceQueryKey({ userAddress, rpcProvider }),
    queryFn: () => getEthereumBalance({ userAddress, rpcProvider }),
    enabled: !!userAddress && !!rpcProvider && enabled,
    staleTime: ETH_BALANCE_STALE_TIME,
    retry: false,
  });
};

export default useGetEthereumBalanceQuery;
