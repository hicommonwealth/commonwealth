import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { fetchCachedNodes } from 'state/api/nodes';
import { fromWei } from 'web3-utils';

interface UseTokenBalanceQueryProps {
  tokenId: string;
  chainId: number;
}

export type GetTokenBalanceResponse = {
  address: string;
  tokenBalances: { contractAddress: string; tokenBalance: string }[];
};

const getTokenBalance = async ({
  tokenId,
  chainId,
}: UseTokenBalanceQueryProps): Promise<GetTokenBalanceResponse> => {
  const ethereumNode = fetchCachedNodes()?.find((n) => n?.id === chainId);

  if (!ethereumNode) {
    throw new Error('Ethereum node not found');
  }

  const response = await axios.post(ethereumNode.url, {
    params: [tokenId],
    method: 'alchemy_getTokenBalances',
  });

  return {
    ...response.data.result,
    tokenBalances: response.data.result.tokenBalances.map((entry) => ({
      ...entry,
      tokenBalance: fromWei(entry.tokenBalance, 'ether'),
    })),
  };
};

const useTokenBalanceQuery = ({
  tokenId,
  chainId,
}: UseTokenBalanceQueryProps) => {
  return useQuery({
    queryKey: [tokenId, chainId, 'alchemy_getTokenBalances'],
    queryFn: () => getTokenBalance({ tokenId, chainId }),
    enabled: !!tokenId,
    retry: false,
  });
};

export default useTokenBalanceQuery;
