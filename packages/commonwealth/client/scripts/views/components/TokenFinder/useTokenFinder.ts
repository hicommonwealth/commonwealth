import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { GetTokenMetadataResponse } from 'client/scripts/state/api/tokens/getTokenMetadata';
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

  const nativeTokenMetadata: GetTokenMetadataResponse = {
    decimals: 18,
    logo: '',
    name: 'ETH', // TODO: get native eth name/symbol
    symbol: 'ETH',
  };

  const getTokenError = (isOneOff?: boolean) => {
    if (tokenValue === ZERO_ADDRESS) {
      return;
    }
    if (isOneOff && !tokenValue) {
      return 'You must enter a token address';
    }

    if (debouncedTokenValue && !tokenMetadataLoading && !tokenMetadata?.name) {
      return 'You must enter a valid token address';
    }
  };

  return {
    tokenValue,
    setTokenValue,
    debouncedTokenValue,
    tokenMetadata:
      tokenValue === ZERO_ADDRESS ? nativeTokenMetadata : tokenMetadata,
    tokenMetadataLoading,
    getTokenError,
  };
};

export default useTokenFinder;
