import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { fetchCachedNodes } from 'state/api/nodes';

const ETH_CHAIN_ID = 37;

interface UseTokenMetadataQueryProps {
  tokenId: string;
}

type GetTokenMetadataResponse = {
  decimals: number;
  logo: string;
  name: string;
  symbol: string;
};

const getTokenMetadata = async ({
  tokenId,
}: UseTokenMetadataQueryProps): Promise<GetTokenMetadataResponse> => {
  const ethereumNode = fetchCachedNodes()?.find((n) => n?.id === ETH_CHAIN_ID);

  if (!ethereumNode) {
    throw new Error('Ethereum node not found');
  }

  const response = await axios.post(ethereumNode.url, {
    params: [tokenId],
    method: 'alchemy_getTokenMetadata',
  });

  return response.data.result;
};

const useTokenMetadataQuery = ({ tokenId }: UseTokenMetadataQueryProps) => {
  return useQuery({
    queryKey: [tokenId],
    queryFn: () => getTokenMetadata({ tokenId }),
    enabled: !!tokenId,
    retry: false,
  });
};

export default useTokenMetadataQuery;
