import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useState } from 'react';
import {
  useFetchTokenUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import {
  useBuyTokenMutation,
  useTokenEthExchangeRateQuery,
} from 'state/api/launchPad';
import { useCreateTokenTradeMutation } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { TokenPresetAmounts, UseBuyTradeProps } from './types';

const useBuyTrade = ({
  enabled,
  tradeConfig,
  chainNode,
  tokenCommunity,
  selectedAddress,
  commonFeePercentage,
  onTradeComplete,
}: UseBuyTradeProps) => {
  const user = useUserStore();
  const [baseCurrencyBuyAmountString, setBaseCurrencyBuyAmountString] =
    useState<string>('0'); // can be fractional
  const baseCurrencyBuyAmountDecimals =
    parseFloat(baseCurrencyBuyAmountString) || 0;

  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
      enabled,
    });
  const ethToCurrencyRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0.00',
  );
  const ethBuyAmount = baseCurrencyBuyAmountDecimals / ethToCurrencyRate;
  const commonPlatformFeeForBuyTradeInEth =
    (commonFeePercentage / 100) * ethBuyAmount;

  // imp: this query uses CommunityStakes helper to get eth price, but its
  // a generic query so no need to initiate a separate Launchpad helper
  const {
    data: selectedAddressEthBalance = `0.0`,
    isLoading: isLoadingUserEthBalance,
  } = useGetUserEthBalanceQuery({
    chainRpc: tokenCommunity?.ChainNode?.url || '',
    ethChainId: tokenCommunity?.ChainNode?.eth_chain_id || 0,
    walletAddress: selectedAddress || '',
    apiEnabled: !!(selectedAddress && tokenCommunity && enabled),
  });

  const {
    data: unitEthToTokenBuyExchangeRate = 0,
    isLoading: isLoadingUnitEthToTokenBuyExchangeRate,
  } = useTokenEthExchangeRateQuery({
    chainRpc: chainNode.url,
    ethChainId: chainNode.ethChainId || 0,
    mode: 'buy',
    tokenAmount: 1 * 1e18, // convert to wei - get exchange rate of 1 unit token to eth
    tokenAddress: tradeConfig.token.token_address,
    enabled: !!(
      chainNode?.url &&
      chainNode?.ethChainId &&
      selectedAddress &&
      tokenCommunity &&
      enabled
    ),
  });

  const { mutateAsync: buyToken, isLoading: isBuyingToken } =
    useBuyTokenMutation();

  const { mutateAsync: createTokenTrade, isLoading: isCreatingTokenTrade } =
    useCreateTokenTradeMutation();

  const onBaseCurrencyBuyAmountChange = (
    change: React.ChangeEvent<HTMLInputElement> | TokenPresetAmounts,
  ) => {
    if (typeof change == 'number') {
      setBaseCurrencyBuyAmountString(`${change}`);
    } else if (typeof change == 'string') {
      // not handling string type preset amounts atm
    } else {
      const value = change.target.value;

      if (value === '') setBaseCurrencyBuyAmountString('0');
      // verify only numbers with decimal (optional) are present
      else if (/^\d*\.?\d*$/.test(value)) setBaseCurrencyBuyAmountString(value);
    }
  };

  const handleTokenBuy = async () => {
    try {
      // this condition wouldn't be called, but adding to avoid typescript issues
      if (
        !chainNode?.url ||
        !chainNode?.ethChainId ||
        !selectedAddress ||
        !tokenCommunity
      ) {
        return;
      }

      // buy token on chain
      const payload = {
        chainRpc: chainNode.url,
        ethChainId: chainNode.ethChainId,
        amountEth: ethBuyAmount * 1e18, // amount in wei
        walletAddress: selectedAddress,
        tokenAddress: tradeConfig.token.token_address,
      };
      const txReceipt = await buyToken(payload);

      // create token trade on db
      await createTokenTrade({
        eth_chain_id: chainNode?.ethChainId,
        transaction_hash: txReceipt.transactionHash,
      });

      // join user's selected address to community
      const isMemberOfCommunity = user.addresses.find(
        (x) => x.community.id === tokenCommunity.id,
      );
      if (!isMemberOfCommunity) {
        await linkSpecificAddressToSpecificCommunity({
          address: selectedAddress,
          community: {
            base: tokenCommunity.base,
            iconUrl: tokenCommunity.icon_url || '',
            id: tokenCommunity.id,
            name: tokenCommunity.name,
          },
        });
      }

      // update user about success
      notifySuccess('Transactions successful!');

      onTradeComplete?.();
    } catch (e) {
      notifyError('Failed to buy token');
      console.log('Failed to buy token => ', e);
    }
  };

  // flag to indicate if something is ongoing
  const isBuyActionPending =
    isLoadingUserEthBalance ||
    isBuyingToken ||
    isLoadingETHToCurrencyRate ||
    isCreatingTokenTrade ||
    isLoadingUnitEthToTokenBuyExchangeRate;

  return {
    // Note: not exporting state setters directly, all "buy token" business logic should be done in this hook
    amounts: {
      invest: {
        baseCurrency: {
          name: tradeConfig.currency, // USD/GBP etc
          amount: baseCurrencyBuyAmountString,
          onAmountChange: onBaseCurrencyBuyAmountChange,
          presetAmounts: tradeConfig.buyTokenPresetAmounts,
          unitEthExchangeRate: ethToCurrencyRate,
          toEth: ethBuyAmount,
        },
        insufficientFunds: ethBuyAmount > parseFloat(selectedAddressEthBalance),
        commonPlatformFee: {
          percentage: `${commonFeePercentage}%`,
          eth: commonPlatformFeeForBuyTradeInEth,
        },
      },
      gain: {
        token:
          unitEthToTokenBuyExchangeRate *
          (ethBuyAmount - commonPlatformFeeForBuyTradeInEth),
      },
    },
    selectedAddressEthBalance: {
      isLoading: isLoadingUserEthBalance,
      value: selectedAddressEthBalance,
    },
    isBuyActionPending,
    handleTokenBuy,
  };
};

export default useBuyTrade;
