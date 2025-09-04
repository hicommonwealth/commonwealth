import {
  useFetchTokensUsdRateQuery,
  useFetchTokenUsdRateQuery,
} from 'state/api/communityStake';
import { fetchCachedNodes } from 'state/api/nodes';
import { useTokenBalanceQuery, useTokensMetadataQuery } from 'state/api/tokens';

type UseUserWalletHoldingsProps = {
  userSelectedAddress: string;
  selectedNetworkChainId?: number;
};

const BASE_MAINNET = 8453; // base mainnet

const useUserWalletHoldings = ({
  userSelectedAddress,
  selectedNetworkChainId = BASE_MAINNET,
}: UseUserWalletHoldingsProps) => {
  const cachedNodes = fetchCachedNodes();
  const chainNode = cachedNodes?.find(
    (c) => c.ethChainId === selectedNetworkChainId,
  );

  // get balances of all the tokens user is holding
  const {
    data: tokenBalances,
    isLoading: isLoadingTokenBalances,
    refetch: refetchTokenBalances,
  } = useTokenBalanceQuery({
    chainId: chainNode?.id || 0,
    tokenId: userSelectedAddress,
  });
  const tokenAddresses = tokenBalances?.tokenBalances.map(
    (b) => b.contractAddress,
  );

  // get metadata (name, symbol etc) of all the tokens user is holding
  const {
    data: tokenMetadatas,
    isLoading: isLoadingTokensMetadata,
    refetch: refetchTokensMetadata,
  } = useTokensMetadataQuery({
    nodeEthChainId: chainNode?.ethChainId || 0,
    tokenIds: tokenAddresses || [],
    apiEnabled: !!(tokenAddresses && chainNode?.ethChainId),
  });

  // get usd conversion rates of all the tokens user is holding
  const {
    data: tokenToUsdDates,
    isLoading: isLoadingTokenToUsdDates,
    refetch: refetchTokenToUsdDates,
  } = useFetchTokensUsdRateQuery({
    tokenContractAddresses: tokenAddresses || [],
    enabled: (tokenMetadatas || []).length > 0,
  });

  // get eth to usd rate
  const {
    data: ethToCurrencyRateData,
    isLoading: isLoadingETHToCurrencyRate,
    refetch: refetchEthToUsdRate,
  } = useFetchTokenUsdRateQuery({
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
        balance: (() => {
          const tempBalance = parseFloat(
            tokenBalances?.tokenBalances.find(
              (b) => b.contractAddress === t.tokenId,
            )?.tokenBalance || '0.',
          );

          // convert the balance to the decimals that the token is meant to
          // be represented in. The `tokenBalances` represents tokens in the
          // smallest possible unit
          if (t.decimals !== 18) {
            return tempBalance * Math.pow(10, 18 - t.decimals);
          }

          return tempBalance;
        })(),
        toUsdPerUnitRate:
          (tokenToUsdDates || []).find((x) => x.symbol === t.symbol)?.price ||
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
        !(t.name + t.symbol).includes('.') &&
        // only include tokens for which we have a coinbase conversion price
        t.toUsdPerUnitRate,
    );

  // get combined usd holding value of all the tokens user has
  const userCombinedUSDBalance = userTokens.reduce((total, token) => {
    const tokenValue = token.toUsdPerUnitRate
      ? token.balance * token.toUsdPerUnitRate
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

  // Function to refetch all data
  const refetch = async () => {
    await Promise.all([
      refetchTokenBalances(),
      refetchTokensMetadata(),
      refetchTokenToUsdDates(),
      refetchEthToUsdRate(),
    ]);
  };

  return {
    isLoadingTokensInfo,
    userTokens,
    userCombinedUSDBalance,
    userCombinedETHBalanceInferredFromCombinedUSDBalance,
    refetch,
  };
};

export default useUserWalletHoldings;
