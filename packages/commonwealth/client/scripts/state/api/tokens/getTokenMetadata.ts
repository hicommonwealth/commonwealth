import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { fetchCachedNodes } from 'state/api/nodes';

interface UseTokenMetadataQueryProps {
  tokenId: string;
  nodeEthChainId: number;
  apiEnabled?: boolean;
}

export type GetTokenMetadataResponse = {
  decimals: number;
  logo: string;
  name: string;
  symbol: string;
};

export const getTokenMetadata = async ({
  tokenId,
  nodeEthChainId,
}: UseTokenMetadataQueryProps): Promise<GetTokenMetadataResponse> => {
  const node = fetchCachedNodes()?.find(
    (n) => n?.ethChainId === nodeEthChainId,
  );

  if (!node) {
    throw new Error('Node not found');
  }

  const response = await axios.post(node.url, {
    params: [tokenId],
    method: 'alchemy_getTokenMetadata',
  });

  return response.data.result;
};

const useTokenMetadataQuery = ({
  tokenId,
  nodeEthChainId,
  apiEnabled = true,
}: UseTokenMetadataQueryProps) => {
  return useQuery({
    queryKey: [tokenId, nodeEthChainId, 'alchemy_getTokenMetadata'],
    queryFn: () => getTokenMetadata({ tokenId, nodeEthChainId }),
    enabled: !!tokenId && apiEnabled,
    retry: false,
  });
};

export default useTokenMetadataQuery;
