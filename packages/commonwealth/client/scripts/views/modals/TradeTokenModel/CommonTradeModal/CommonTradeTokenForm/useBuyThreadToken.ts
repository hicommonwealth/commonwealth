import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import TokenLaunchpad from 'helpers/ContractHelpers/tokenLaunchpad';
import { useEffect, useMemo, useState } from 'react';
import {
  useFetchTokenUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import { useBuyThreadTokenMutation } from 'state/api/threads';
import { useCreateTokenTradeMutation } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { TokenPresetAmounts, UseBuyTradeProps } from './types';

const useBuyThreadToken = ({
  enabled,
  tradeConfig,
  chainNode,
  tokenCommunity,
  selectedAddress,
  commonFeePercentage,
  onTradeComplete,
}: UseBuyTradeProps) => {
  const [baseCurrencyBuyAmountString, setBaseCurrencyBuyAmountString] =
    useState<string>('0');
  const [tokenGainAmount, setTokenGainAmount] = useState<number>(0);
  const [isLoadingTokenGainAmount, setIsLoadingTokenGainAmount] =
    useState<boolean>(false);

  const baseCurrencyBuyAmountDecimals =
    parseFloat(baseCurrencyBuyAmountString) || 0;
  const primaryTokenSymbol = tokenCommunity?.default_symbol || 'ETH';

  const { data: primaryTokenRateData, isLoading: isLoadingPrimaryTokenRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: primaryTokenSymbol,
      enabled,
    });
  const primaryTokenRate = parseFloat(
    primaryTokenRateData?.data?.data?.amount || '0.00',
  );

  const ethChainId = tokenCommunity?.ChainNode?.eth_chain_id || 0;

  const isSelectedAddressEthBalanceQueryEnabled = !!(
    selectedAddress &&
    tokenCommunity &&
    enabled
  );

  const {
    data: selectedAddressPrimaryTokenBalance = `0.0`,
    isLoading: isLoadingUserPrimaryTokenBalance,
  } = useGetUserEthBalanceQuery({
    chainRpc: tokenCommunity?.ChainNode?.url || '',
    ethChainId,
    walletAddress: selectedAddress || '',
    apiEnabled: isSelectedAddressEthBalanceQueryEnabled,
  });

  const user = useUserStore();
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const tokenLaunchpad = useMemo(() => {
    if (
      chainNode?.url &&
      ethChainId &&
      selectedAddress &&
      tokenCommunity &&
      enabled
    ) {
      const factoryAddress = getFactoryContract(ethChainId).TokenLaunchpad;
      const bondingCurve = getFactoryContract(ethChainId).TokenBondingCurve;
      const paymentTokenAddress = tokenCommunity.thread_purchase_token || '';

      return new TokenLaunchpad(
        factoryAddress,
        bondingCurve,
        paymentTokenAddress,
        chainNode.url,
      );
    }
    return null;
  }, [chainNode?.url, ethChainId, selectedAddress, tokenCommunity, enabled]);

  const commonPlatformFeeForBuyTradeInPrimaryToken =
    (baseCurrencyBuyAmountDecimals * commonFeePercentage) / 100;

  const onBaseCurrencyBuyAmountChange = (
    change: React.ChangeEvent<HTMLInputElement> | TokenPresetAmounts,
  ) => {
    if (typeof change === 'string') {
      setBaseCurrencyBuyAmountString(change);
    } else if (typeof change === 'number') {
      setBaseCurrencyBuyAmountString(change.toString());
    } else {
      setBaseCurrencyBuyAmountString(change.target.value);
    }
  };

  useEffect(() => {
    const fetchTokenGainAmount = async () => {
      if (
        !tokenLaunchpad ||
        !chainNode ||
        baseCurrencyBuyAmountDecimals <= 0 ||
        commonPlatformFeeForBuyTradeInPrimaryToken >=
          baseCurrencyBuyAmountDecimals
      ) {
        setTokenGainAmount(0);
        return;
      }

      try {
        setIsLoadingTokenGainAmount(true);

        const amountInWei =
          (baseCurrencyBuyAmountDecimals -
            commonPlatformFeeForBuyTradeInPrimaryToken) *
          1e18;

        const amountOut = await tokenLaunchpad.getAmountOut(
          tradeConfig.token.token_address,
          amountInWei,
          true,
          `${ethChainId}`,
        );
        setTokenGainAmount(amountOut);
      } catch (error) {
        console.error('Error fetching token gain amount:', error);
        setTokenGainAmount(0);
      } finally {
        setIsLoadingTokenGainAmount(false);
      }
    };

    void fetchTokenGainAmount();
  }, [
    tokenLaunchpad,
    chainNode,
    baseCurrencyBuyAmountDecimals,
    commonPlatformFeeForBuyTradeInPrimaryToken,
    ethChainId,
    tradeConfig.token.token_address,
  ]);

  const { mutateAsync: buyThreadToken, isPending: isBuyingThreadToken } =
    useBuyThreadTokenMutation();

  const { mutateAsync: createTokenTrade, isPending: isCreatingTokenTrade } =
    useCreateTokenTradeMutation();

  const handleTokenBuy = async () => {
    try {
      if (
        !chainNode?.url ||
        !ethChainId ||
        !selectedAddress ||
        !tokenCommunity
      ) {
        return;
      }

      if (!tokenCommunity.thread_purchase_token) {
        notifyError('Thread purchase token not found');
        return;
      }

      const amountInWei = baseCurrencyBuyAmountDecimals * 1e18;
      const minAmountOut = tokenGainAmount * 0.95 * 1e18;

      const payload = {
        chainRpc: chainNode.url,
        ethChainId,
        tokenAddress: tradeConfig.token.token_address,
        amountIn: amountInWei,
        walletAddress: selectedAddress,
        minAmountOut: minAmountOut,
        paymentTokenAddress: tokenCommunity.thread_purchase_token,
      };

      const txReceipt = await buyThreadToken(payload);

      await createTokenTrade({
        eth_chain_id: ethChainId,
        transaction_hash: txReceipt.transactionHash,
      });

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

      notifySuccess('Thread token purchased successfully!');

      onTradeComplete?.();
    } catch (e) {
      notifyError('Failed to buy thread token');
      console.log('Failed to buy thread token => ', e);
    }
  };

  const isBuyActionPending =
    enabled &&
    (isLoadingUserPrimaryTokenBalance ||
      isBuyingThreadToken ||
      isLoadingPrimaryTokenRate ||
      isCreatingTokenTrade ||
      isLoadingTokenGainAmount);

  return {
    amounts: {
      invest: {
        ethBuyCurrency: tradeConfig.ethBuyCurrency,
        baseCurrency: {
          name: primaryTokenSymbol,
          amount: baseCurrencyBuyAmountString,
          onAmountChange: onBaseCurrencyBuyAmountChange,
          presetAmounts: tradeConfig.buyTokenPresetAmounts,
          unitEthExchangeRate: primaryTokenRate,
          toEth: baseCurrencyBuyAmountDecimals,
        },
        insufficientFunds:
          baseCurrencyBuyAmountDecimals >
          parseFloat(selectedAddressPrimaryTokenBalance),
        commonPlatformFee: {
          percentage: `${commonFeePercentage}%`,
          eth: commonPlatformFeeForBuyTradeInPrimaryToken,
        },
      },
      gain: {
        token: tokenGainAmount,
        isLoading: isLoadingTokenGainAmount,
      },
    },
    selectedAddressPrimaryTokenBalance: {
      isLoading: isLoadingUserPrimaryTokenBalance,
      value: selectedAddressPrimaryTokenBalance,
    },
    isBuyActionPending,
    handleTokenBuy,
  };
};

export default useBuyThreadToken;
