import React from 'react';
import { GetTokenMetadataResponse } from 'state/api/tokens/getTokenMetadata';
import TokenBanner from '../TokenBanner';
import { CWTextInput } from '../component_kit/new_designs/CWTextInput';
import { TextInputProps } from '../component_kit/new_designs/CWTextInput/CWTextInput';

type TokenFinderProps = {
  tokenValue: string;
  setTokenValue: React.Dispatch<React.SetStateAction<string>>;
  tokenError?: string;
  debouncedTokenValue: string;
  tokenMetadataLoading: boolean;
  tokenMetadata?: GetTokenMetadataResponse;
  tokenAddress?: string;
  chainName?: string;
  chainEthId?: number;
} & TextInputProps;

const TokenFinder = ({
  tokenValue,
  setTokenValue,
  tokenError,
  debouncedTokenValue,
  tokenMetadataLoading,
  tokenMetadata,
  tokenAddress,
  chainName,
  chainEthId,
  ...rest
}: TokenFinderProps) => {
  return (
    <>
      <CWTextInput
        // can be overridden by `...rest`
        label="Token"
        placeholder="Enter Token Address"
        {...rest}
        // not changeable
        value={tokenValue}
        onInput={(e) => setTokenValue(e.target.value.trim())}
        customError={tokenError}
      />
      {debouncedTokenValue && !tokenError && (
        <TokenBanner
          isLoading={tokenMetadataLoading}
          avatarUrl={tokenMetadata?.logo}
          name={tokenMetadata?.name}
          ticker={tokenMetadata?.symbol}
          tokenAddress={tokenAddress}
          chainName={chainName}
          chainEthId={chainEthId}
        />
      )}
    </>
  );
};

export default TokenFinder;
