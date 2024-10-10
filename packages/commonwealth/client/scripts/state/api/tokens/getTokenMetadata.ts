import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { fetchCachedNodes } from 'state/api/nodes';

interface UseTokenMetadataQueryProps {
  tokenId: string;
  chainId: number;
  apiEnabled?: boolean;
}

export type GetTokenMetadataResponse = {
  decimals: number;
  logo: string;
  name: string;
  symbol: string;
};

const getTokenMetadata = async ({
  tokenId,
  chainId,
}: UseTokenMetadataQueryProps): Promise<GetTokenMetadataResponse> => {
  const ethereumNode = fetchCachedNodes()?.find((n) => n?.id === chainId);

  if (!ethereumNode) {
    throw new Error('Ethereum node not found');
  }

  const response = await axios.post(ethereumNode.url, {
    params: [tokenId],
    method: 'alchemy_getTokenMetadata',
  });

  return response.data.result;
};

const useTokenMetadataQuery = ({
  tokenId,
  chainId,
  apiEnabled = true,
}: UseTokenMetadataQueryProps) => {
  return useQuery({
    queryKey: [tokenId, chainId],
    queryFn: () => getTokenMetadata({ tokenId, chainId }),
    enabled: !!tokenId && apiEnabled,
    retry: false,
  });
};

export default useTokenMetadataQuery;
