import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { useEffect, useMemo, useState } from 'react';
import {
  useFetchTokenUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import { useBuyTokenMutation } from 'state/api/launchPad';
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

  const [tokenGainAmount, setTokenGainAmount] = useState<number>(0);
  const [isLoadingTokenGainAmount, setIsLoadingTokenGainAmount] =
    useState<boolean>(false);

  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
      enabled,
    });
  const ethToCurrencyRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0.00',
  );
  const commonPlatformFeeForBuyTradeInEth =
    (commonFeePercentage / 100) * baseCurrencyBuyAmountDecimals;

  // imp: this query uses CommunityStakes helper to get eth price, but its
  // a generic query so no need to initiate a separate Launchpad helper
  const isSelectedAddressEthBalanceQueryEnabled = !!(
    selectedAddress &&
    tokenCommunity &&
    enabled
  );
  const ethChainId = tokenCommunity?.ChainNode?.eth_chain_id || 0;
  const {
    data: selectedAddressEthBalance = `0.0`,
    isLoading: isLoadingUserEthBalance,
  } = useGetUserEthBalanceQuery({
    chainRpc: tokenCommunity?.ChainNode?.url || '',
    ethChainId,
    walletAddress: selectedAddress || '',
    apiEnabled: isSelectedAddressEthBalanceQueryEnabled,
  });

  const launchPad = useMemo(() => {
    if (
      chainNode?.url &&
      ethChainId &&
      selectedAddress &&
      tokenCommunity &&
      enabled
    ) {
      return new LaunchpadBondingCurve(
        getFactoryContract(ethChainId).LPBondingCurve,
        getFactoryContract(ethChainId).Launchpad,
        tradeConfig.token.token_address,
        getFactoryContract(ethChainId).TokenCommunityManager,
        chainNode.url,
      );
    }
    return null;
  }, [
    chainNode?.url,
    ethChainId,
    selectedAddress,
    tokenCommunity,
    enabled,
    tradeConfig.token.token_address,
  ]);

  useEffect(() => {
    const fetchTokenGainAmount = async () => {
      if (
        !launchPad ||
        !chainNode ||
        baseCurrencyBuyAmountDecimals <= 0 ||
        commonPlatformFeeForBuyTradeInEth >= baseCurrencyBuyAmountDecimals
      ) {
        setTokenGainAmount(0);
        return;
      }

      try {
        setIsLoadingTokenGainAmount(true);
        // Convert to wei and account for platform fee
        const amountInWei =
          (baseCurrencyBuyAmountDecimals - commonPlatformFeeForBuyTradeInEth) *
          1e18;
        const amountOut = await launchPad.getAmountOut(
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
    launchPad,
    chainNode,
    baseCurrencyBuyAmountDecimals,
    commonPlatformFeeForBuyTradeInEth,
    ethChainId,
  ]);

  const { mutateAsync: buyToken, isPending: isBuyingToken } =
    useBuyTokenMutation();

  const { mutateAsync: createTokenTrade, isPending: isCreatingTokenTrade } =
    useCreateTokenTradeMutation();

  const onBaseCurrencyBuyAmountChange = (
    change: React.ChangeEvent<HTMLInputElement> | TokenPresetAmounts,
  ) => {
    if (typeof change == 'number') {
      // preset amounts are in tradeConfig.ethBuyCurrency
      const ethToBuyFromUSDPresetAmount = change / ethToCurrencyRate;
      setBaseCurrencyBuyAmountString(`${ethToBuyFromUSDPresetAmount}`);
    } else if (typeof change == 'string') {
      // not handling string type preset amounts atm
    } else {
      const value = change.target.value;

      if (value === '') setBaseCurrencyBuyAmountString('0');
      // verify only numbers with decimal (optional) are present
      else if (/^\d*\.?\d*$/.test(value)) {
        setBaseCurrencyBuyAmountString(
          value.includes('.') ? value : value.replace(/^0+(?!$)/, ''), // remove leading 0's from non-decimal values
        );
      }
    }
  };

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

      // buy token on chain
      const payload = {
        chainRpc: chainNode.url,
        ethChainId,
        amountEth: baseCurrencyBuyAmountDecimals * 1e18, // amount in wei
        walletAddress: selectedAddress,
        tokenAddress: tradeConfig.token.token_address,
        tokenUrl: tradeConfig.token.icon_url!,
      };
      const txReceipt = await buyToken(payload);

      // create token trade on db
      await createTokenTrade({
        eth_chain_id: ethChainId,
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
    enabled &&
    (isLoadingUserEthBalance ||
      isBuyingToken ||
      isLoadingETHToCurrencyRate ||
      isCreatingTokenTrade ||
      isLoadingTokenGainAmount);

  return {
    // Note: not exporting state setters directly, all "buy token" business logic should be done in this hook
    amounts: {
      invest: {
        ethBuyCurrency: tradeConfig.ethBuyCurrency,
        baseCurrency: {
          // eth will be the currency used to buy token, and eth will be bought with tradeConfig.ethBuyCurrency
          name: 'ETH',
          amount: baseCurrencyBuyAmountString,
          onAmountChange: onBaseCurrencyBuyAmountChange,
          presetAmounts: tradeConfig.buyTokenPresetAmounts,
          unitEthExchangeRate: ethToCurrencyRate,
          toEth: baseCurrencyBuyAmountDecimals,
        },
        insufficientFunds:
          baseCurrencyBuyAmountDecimals > parseFloat(selectedAddressEthBalance),
        commonPlatformFee: {
          percentage: `${commonFeePercentage}%`,
          eth: commonPlatformFeeForBuyTradeInEth,
        },
      },
      gain: {
        token: tokenGainAmount,
        isLoading: isLoadingTokenGainAmount,
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
