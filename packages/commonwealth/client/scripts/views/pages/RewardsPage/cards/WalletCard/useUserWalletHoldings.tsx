import { useFetchTokensUsdRateQuery } from 'state/api/communityStake';
import { useTokenBalanceQuery, useTokensMetadataQuery } from 'state/api/tokens';

type UseUserWalletHoldingsProps = {
  userSelectedAddress: string;
};

const useUserWalletHoldings = ({
  userSelectedAddress,
}: UseUserWalletHoldingsProps) => {
  // get balances of all the tokens user is holding
  const { data: tokenBalances, isLoading: isLoadingTokenBalances } =
    useTokenBalanceQuery({
      chainId: 1358,
      tokenId: userSelectedAddress,
    });
  const tokenAddresses = tokenBalances?.tokenBalances.map(
    (b) => b.contractAddress,
  );

  // get metadata (name, symbol etc) of all the tokens user is holding
  const { data: tokenMetadatas, isLoading: isLoadingTokensMetadata } =
    useTokensMetadataQuery({
      nodeEthChainId: 8453,
      tokenIds: tokenAddresses || [],
      apiEnabled: !!tokenAddresses,
    });

  // get usd conversion rates of all the tokens user is holding
  const { data: tokenToUsdDates, isLoading: isLoadingTokenToUsdDates } =
    useFetchTokensUsdRateQuery({
      tokenSymbols: (tokenMetadatas || []).map((x) => x.symbol),
      enabled: (tokenMetadatas || []).length > 0,
    });
  const tokensHavingRateConversions = (tokenToUsdDates || []).map(
    (x) => x.symbol,
  );

  // combine the data fetched above
  const userTokens = [...(tokenMetadatas || [])]
    .map((t) => {
      return {
        ...t,
        balance: parseFloat(
          tokenBalances?.tokenBalances.find(
            (b) => b.contractAddress === t.tokenId,
          )?.tokenBalance || '0.',
        ),
        toUsdPerUnitRate:
          (tokenToUsdDates || []).find((x) => x.symbol === t.symbol)?.amount ||
          null,
      };
    })
    .filter((t) => t.name && tokensHavingRateConversions.includes(t.symbol));

  // get combined usd holding value of all the tokens user has
  const userCombinedUSDBalance = userTokens.reduce((total, token) => {
    const tokenValue = token.toUsdPerUnitRate
      ? token.balance * parseFloat(token.toUsdPerUnitRate)
      : 0;
    return total + tokenValue;
  }, 0);

  const isLoadingTokensInfo =
    isLoadingTokenBalances ||
    isLoadingTokensMetadata ||
    isLoadingTokenToUsdDates;

  return {
    isLoadingTokensInfo,
    userTokens,
    userCombinedUSDBalance,
  };
};

export default useUserWalletHoldings;
