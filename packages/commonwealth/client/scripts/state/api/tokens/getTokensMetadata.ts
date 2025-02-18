import { useQuery } from '@tanstack/react-query';
import { getTokenMetadata } from './getTokenMetadata';

interface UseTokensMetadataQueryProps {
  tokenIds: string[];
  nodeEthChainId: number;
  apiEnabled?: boolean;
}

const FETCH_TOKENS_METADATA_STALE_TIME = 60 * 60_000; // 1 hour

export type GetTokensMetadataResponse = {
  decimals: number;
  logo: string;
  name: string;
  symbol: string;
  tokenId: string;
}[];

const getTokensMetadata = async ({
  tokenIds,
  nodeEthChainId,
}: UseTokensMetadataQueryProps): Promise<GetTokensMetadataResponse> => {
  const metadatas = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const metadata = await getTokenMetadata({
        nodeEthChainId,
        tokenId,
      });

      return {
        ...metadata,
        tokenId,
      };
    }),
  );

  return metadatas;
};

const useTokensMetadataQuery = ({
  tokenIds,
  nodeEthChainId,
  apiEnabled = true,
}: UseTokensMetadataQueryProps) => {
  return useQuery({
    queryKey: [...tokenIds, nodeEthChainId, 'alchemy_getTokenMetadata'],
    queryFn: () => getTokensMetadata({ tokenIds, nodeEthChainId }),
    enabled: !!(tokenIds.filter(Boolean).length > 0 && apiEnabled),
    cacheTime: FETCH_TOKENS_METADATA_STALE_TIME,
    retry: false,
  });
};

export default useTokensMetadataQuery;
