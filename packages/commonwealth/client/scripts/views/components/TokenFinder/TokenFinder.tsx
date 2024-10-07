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
} & TextInputProps;

const TokenFinder = ({
  tokenValue,
  setTokenValue,
  tokenError,
  debouncedTokenValue,
  tokenMetadataLoading,
  tokenMetadata,
  ...rest
}: TokenFinderProps) => {
  return (
    <>
      <CWTextInput
        // can be overridden by `...rest`
        label="Token"
        placeholder="Please enter primary token"
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
        />
      )}
    </>
  );
};

export default TokenFinder;
