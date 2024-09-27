import { useState } from 'react';
import { useTokenMetadataQuery } from 'state/api/tokens';
import { useDebounce } from 'usehooks-ts';

type UseTokenFinderProps = {
  chainId: number;
};

const useTokenFinder = ({ chainId }: UseTokenFinderProps) => {
  const [tokenValue, setTokenValue] = useState('');
  const debouncedTokenValue = useDebounce<string>(tokenValue, 500);

  const { data: tokenMetadata, isLoading: tokenMetadataLoading } =
    useTokenMetadataQuery({
      tokenId: debouncedTokenValue,
      chainId,
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
