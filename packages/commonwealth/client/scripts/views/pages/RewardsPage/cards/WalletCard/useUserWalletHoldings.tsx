import {
  useFetchTokensUsdRateQuery,
  useFetchTokenUsdRateQuery,
} from 'state/api/communityStake';
import { fetchCachedNodes } from 'state/api/nodes';
import { useTokenBalanceQuery, useTokensMetadataQuery } from 'state/api/tokens';

type UseUserWalletHoldingsProps = {
  userSelectedAddress: string;
};

const CHAIN_FOR_HOLDINGS = 1358; // base mainnet

const useUserWalletHoldings = ({
  userSelectedAddress,
}: UseUserWalletHoldingsProps) => {
  const cachedNodes = fetchCachedNodes();
  const chainNode = cachedNodes?.find((c) => c.id === CHAIN_FOR_HOLDINGS);

  // get balances of all the tokens user is holding
  const { data: tokenBalances, isLoading: isLoadingTokenBalances } =
    useTokenBalanceQuery({
      chainId: CHAIN_FOR_HOLDINGS,
      tokenId: userSelectedAddress,
    });
  const tokenAddresses = tokenBalances?.tokenBalances.map(
    (b) => b.contractAddress,
  );

  // get metadata (name, symbol etc) of all the tokens user is holding
  const { data: tokenMetadatas, isLoading: isLoadingTokensMetadata } =
    useTokensMetadataQuery({
      nodeEthChainId: chainNode?.ethChainId || 0,
      tokenIds: tokenAddresses || [],
      apiEnabled: !!(tokenAddresses && chainNode?.ethChainId),
    });

  // get usd conversion rates of all the tokens user is holding
  const { data: tokenToUsdDates, isLoading: isLoadingTokenToUsdDates } =
    useFetchTokensUsdRateQuery({
      tokenSymbols: (tokenMetadatas || []).map((x) => x.symbol),
      enabled: (tokenMetadatas || []).length > 0,
    });

  // get eth to usd rate
  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
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
    .filter(
      (t) =>
        // some tokens don't have a name
        t.name &&
        // hiding tokens that don't showup in user wallet ex:
        // - `name="NEIRO",symbol="Visit getneirocoin.xyz to Claim"`
        // - `name="Venice Token",symbol="Claim: venice-claim.com"`
        // and more. Filtering by a `.` as these usually have a domain name in symbol
        !(t.name + t.symbol).includes('.'),
    );

  // get combined usd holding value of all the tokens user has
  const userCombinedUSDBalance = userTokens.reduce((total, token) => {
    const tokenValue = token.toUsdPerUnitRate
      ? token.balance * parseFloat(token.toUsdPerUnitRate)
      : 0;
    return total + tokenValue;
  }, 0);

  // get combined eth value inferred from combined usd holding value for eth tokens
  // Important: this doesn't include native ether balance
  const userCombinedETHBalanceInferredFromCombinedUSDBalance =
    userCombinedUSDBalance / ethToUsdRate;

  const isLoadingTokensInfo =
    isLoadingTokenBalances ||
    isLoadingTokensMetadata ||
    isLoadingTokenToUsdDates ||
    isLoadingETHToCurrencyRate;

  return {
    isLoadingTokensInfo,
    userTokens,
    userCombinedUSDBalance,
    userCombinedETHBalanceInferredFromCombinedUSDBalance,
  };
};

export default useUserWalletHoldings;
