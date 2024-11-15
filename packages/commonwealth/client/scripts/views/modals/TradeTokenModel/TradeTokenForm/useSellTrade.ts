import {
  useSellTokenMutation,
  useTokenEthExchangeRateQuery,
} from 'client/scripts/state/api/launchPad';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useState } from 'react';
import {
  useCreateTokenTradeMutation,
  useGetERC20BalanceQuery,
} from 'state/api/tokens';
import { TokenPresetAmounts, UseSellTradeProps } from './types';

const useSellTrade = ({
  enabled,
  chainNode,
  commonFeePercentage,
  selectedAddress,
  tokenCommunity,
  tradeConfig,
  onTradeComplete,
}: UseSellTradeProps) => {
  const [tokenSellAmountString, setTokenSellAmountString] =
    useState<string>(`0`); // can be fractional
  const tokenSellAmountDecimals = parseFloat(tokenSellAmountString) || 0;

  const { mutateAsync: createTokenTrade, isLoading: isCreatingTokenTrade } =
    useCreateTokenTradeMutation();

  const { mutateAsync: sellToken, isLoading: isSellingToken } =
    useSellTokenMutation();

  const {
    data: selectedAddressTokenBalance = `0.0`,
    isLoading: isLoadingUserTokenBalance,
  } = useGetERC20BalanceQuery({
    nodeRpc: tokenCommunity?.ChainNode?.url || '',
    tokenAddress: tradeConfig.token.token_address,
    userAddress: selectedAddress || '',
    enabled,
  });

  const {
    data: unitTokenToEthSellExchangeRate = 0,
    isLoading: isLoadingUnitTokenToEthSellExchangeRate,
  } = useTokenEthExchangeRateQuery({
    chainRpc: chainNode.url,
    ethChainId: chainNode.ethChainId || 0,
    mode: 'sell',
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

  const ethSellAmount =
    unitTokenToEthSellExchangeRate * tokenSellAmountDecimals;
  const commonPlatformFeeForSellTradeInEth =
    (commonFeePercentage / 100) * ethSellAmount;

  const onTokenSellAmountChange = (
    change: React.ChangeEvent<HTMLInputElement> | TokenPresetAmounts,
  ) => {
    if (typeof change == 'number') {
      // not handling number type preset amounts atm
    } else if (typeof change == 'string') {
      if (change === 'Max') {
        setTokenSellAmountString(selectedAddressTokenBalance);
      }
    } else {
      const value = change.target.value;

      if (value === '') setTokenSellAmountString(`0`);
      // verify only numbers with decimal (optional) are present
      else if (/^\d*\.?\d*$/.test(value)) setTokenSellAmountString(value);
    }
  };

  const handleTokenSell = async () => {
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
        amountToken: tokenSellAmountDecimals * 1e18, // amount in wei
        walletAddress: selectedAddress,
        tokenAddress: tradeConfig.token.token_address,
      };
      const txReceipt = await sellToken(payload);

      // create token trade on db
      await createTokenTrade({
        eth_chain_id: chainNode?.ethChainId,
        transaction_hash: txReceipt.transactionHash,
      });

      // update user about success
      notifySuccess('Transactions successful!');

      onTradeComplete?.();
    } catch (e) {
      notifyError('Failed to sell token');
      console.log('Failed to sell token => ', e);
    }
  };

  // flag to indicate if something is ongoing
  const isSellActionPending =
    isLoadingUserTokenBalance ||
    isSellingToken ||
    isCreatingTokenTrade ||
    isLoadingUnitTokenToEthSellExchangeRate;

  return {
    // Note: not exporting state setters directly, all "sell token" business logic should be done in this hook
    amounts: {
      invest: {
        // not to be confused with "Base" network on ethereum
        baseToken: {
          amount: tokenSellAmountString,
          onAmountChange: onTokenSellAmountChange,
          presetAmounts: tradeConfig.sellTokenPresetAmounts,
          unitEthExchangeRate: unitTokenToEthSellExchangeRate,
          toEth: ethSellAmount,
        },
        insufficientFunds:
          tokenSellAmountDecimals > parseFloat(selectedAddressTokenBalance),
        commonPlatformFee: {
          percentage: `${commonFeePercentage}%`,
          eth: commonPlatformFeeForSellTradeInEth,
        },
      },
      gain: {
        eth: ethSellAmount - commonPlatformFeeForSellTradeInEth,
      },
    },
    selectedAddressTokenBalance: {
      isLoading: isLoadingUserTokenBalance,
      value: selectedAddressTokenBalance,
    },
    isSellActionPending,
    handleTokenSell,
  };
};

export default useSellTrade;
