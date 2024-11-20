import { useQuery } from '@tanstack/react-query';
import ERC20Helper from 'helpers/ContractHelpers/ERC20Helper';

const GET_ERC20_BALANCE_STALE_TIME = 60 * 1_000; // 1 min

interface UseGetERC20BalanceQueryProps {
  userAddress: string;
  tokenAddress: string;
  nodeRpc: string;
}

const getERC20Balance = async ({
  userAddress,
  tokenAddress,
  nodeRpc,
}: UseGetERC20BalanceQueryProps) => {
  const helper = new ERC20Helper(tokenAddress, nodeRpc);

  return await helper.getBalance(userAddress);
};

const useGetERC20BalanceQuery = ({
  userAddress,
  tokenAddress,
  nodeRpc,
  enabled = true,
}: UseGetERC20BalanceQueryProps & { enabled?: boolean }) => {
  return useQuery({
    queryKey: [userAddress, tokenAddress, nodeRpc],
    queryFn: () => getERC20Balance({ userAddress, tokenAddress, nodeRpc }),
    enabled: !!tokenAddress && !!userAddress && !!nodeRpc && enabled,
    staleTime: GET_ERC20_BALANCE_STALE_TIME,
    retry: false,
  });
};

export default useGetERC20BalanceQuery;
