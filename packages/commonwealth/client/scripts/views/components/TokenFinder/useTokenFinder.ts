import { useState } from 'react';
import { useTokenMetadataQuery } from 'state/api/tokens';
import { useDebounce } from 'usehooks-ts';

type UseTokenFinderProps = {
  nodeEthChainId: number;
  initialTokenValue?: string | null;
};

const useTokenFinder = ({
  nodeEthChainId,
  initialTokenValue,
}: UseTokenFinderProps) => {
  const [tokenValue, setTokenValue] = useState(initialTokenValue || '');
  const debouncedTokenValue = useDebounce<string>(tokenValue, 500);

  const { data: tokenMetadata, isLoading: tokenMetadataLoading } =
    useTokenMetadataQuery({
      tokenId: debouncedTokenValue,
      nodeEthChainId,
    });

  const getTokenError = () => {
    if (debouncedTokenValue && !tokenMetadataLoading && !tokenMetadata?.name) {
      return 'You must enter a valid token address';
    }
  };

  return {
    tokenValue,
    setTokenValue,
    debouncedTokenValue,
    tokenMetadata,
    tokenMetadataLoading,
    getTokenError,
  };
};

export default useTokenFinder;
