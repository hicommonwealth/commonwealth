import { commonProtocol } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useMemo, useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import {
  useFetchTokenUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import { useBuyTokenMutation } from 'state/api/launchPad';
import { fetchCachedNodes } from 'state/api/nodes';
import { useCreateTokenTradeMutation } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import './TradeTokenForm.scss';
import { TradingMode, UseTokenTradeFormProps } from './types';

const useTokenTradeForm = ({
  tradeConfig,
  addressType,
  onTradeComplete,
}: UseTokenTradeFormProps) => {
  const [baseCurrencyTradingAmount, setBaseCurrencyTradingAmount] =
    useState<number>(0);
  const [tradingMode, setTradingMode] = useState<TradingMode>(
    tradeConfig.mode || TradingMode.Buy,
  );
  const user = useUserStore();
  const userAddresses = useMemo(() => {
    // get all the addresses of the user that matches chain base
    const tempUserAddresses = user.addresses
      .filter((addr) =>
        addressType ? addr.community.base === addressType : true,
      )
      .map((addr) => addr.address);

    // return all the unique addresses
    return [...new Set(tempUserAddresses)];
  }, [user.addresses, addressType]);
  const [selectedAddress, setSelectedAddress] = useState<string>();

  // base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === commonProtocol.ValidChains.SepoliaBase,
  ) as NodeInfo; // this is expected to exist

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToCurrencyRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0.00',
  );

  const ethBuyAmount = baseCurrencyTradingAmount / ethToCurrencyRate;

  const { data: tokenCommunity, isLoading: isLoadingTokenCommunity } =
    useGetCommunityByIdQuery({
      id: tradeConfig.token.community_id,
      enabled: !!tradeConfig.token.community_id,
      includeNodeInfo: true,
    });

  // imp: this query uses CommunityStakes helper to get eth price, but its
  // a generic query so no need to initiate a separate Launhpad helper
  const {
    data: selectedAddressEthBalance = `0.0`,
    isLoading: isLoadingUserEthBalance,
  } = useGetUserEthBalanceQuery({
    chainRpc: tokenCommunity?.ChainNode?.url || '',
    ethChainId: tokenCommunity?.ChainNode?.eth_chain_id || 0,
    walletAddress: selectedAddress || '',
    apiEnabled: !!(selectedAddress && tokenCommunity),
  });

  useRunOnceOnCondition({
    callback: () => setSelectedAddress(userAddresses[0]),
    shouldRun: userAddresses.length > 0 && !selectedAddress,
  });

  const { mutateAsync: buyToken, isLoading: isBuyingToken } =
    useBuyTokenMutation();

  const { mutateAsync: createTokenTrade, isLoading: isCreatingTokenTrade } =
    useCreateTokenTradeMutation();

  const onBaseCurrencyTradingAmountChange = (
    change: React.ChangeEvent<HTMLInputElement> | number,
  ) => {
    if (typeof change == 'number') {
      setBaseCurrencyTradingAmount(change);
    } else {
      const value = change.target.value;

      if (value === '') setBaseCurrencyTradingAmount(0);
      // verify only numbers with decimal (optional) are present
      else if (/^\d+(\.\d+)?$/.test(value))
        setBaseCurrencyTradingAmount(parseFloat(value));
    }
  };

  const onTradingModeChange = (mode: TradingMode) => {
    setTradingMode(mode);
  };

  const onChangeSelectedAddress = (address: string) => {
    setSelectedAddress(address);
  };

  const handleTokenBuy = async () => {
    try {
      // this condition wouldn't be called, but adding to avoid typescript issues
      if (!baseNode?.url || !baseNode?.ethChainId || !selectedAddress) return;

      // buy token on chain
      const payload = {
        chainRpc: baseNode.url,
        ethChainId: baseNode.ethChainId,
        amountEth: ethBuyAmount,
        walletAddress: selectedAddress,
        tokenAddress: tradeConfig.token.token_address,
      };
      const txReceipt = await buyToken(payload);

      // create token trade on db
      await createTokenTrade({
        eth_chain_id: baseNode?.ethChainId,
        transaction_hash: txReceipt.transactionHash,
      });

      onTradeComplete?.();
    } catch (e) {
      notifyError('Failed to buy token');
      console.log('Failed to buy token => ', e);
    }
  };

  const handleTokenSell = async () => {
    // TODO: implement selling logic
  };

  // flag to indicate if something is ongoing
  const isActionPending =
    isLoadingTokenCommunity ||
    isLoadingUserEthBalance ||
    isBuyingToken ||
    isLoadingETHToCurrencyRate ||
    isCreatingTokenTrade;

  const onCTAClick = () => {
    if (isActionPending) return;

    switch (tradingMode) {
      case TradingMode.Buy:
        handleTokenBuy().catch(console.error);
        break;
      case TradingMode.Sell:
        handleTokenSell().catch(console.error);
        break;
      default:
        console.error('Trading mode not selected');
        break;
    }
  };

  return {
    // Note: not exporting state setters directly, since some extra
    // functionality is done in most "onChange" handlers above
    trading: {
      amounts: {
        buy: {
          eth: ethBuyAmount,
          token: 100, // TODO: hardcoded for now
          baseCurrency: {
            name: tradeConfig.currency, // USD/GBP etc
            amount: baseCurrencyTradingAmount,
            onAmountChange: onBaseCurrencyTradingAmountChange,
            presetAmounts: tradeConfig.presetAmounts,
          },
          insufficientFunds:
            ethBuyAmount > parseFloat(selectedAddressEthBalance),
        },
      },
      unitEthToBaseCurrencyRate: ethToCurrencyRate,
      mode: { value: tradingMode, onChange: onTradingModeChange },
      token: tradeConfig.token,
      // TODO: hardcoded for now
      commonPlatformFee: {
        percentage: '0.5%',
        eth: 0.0000178,
      },
    },
    addresses: {
      available: userAddresses,
      default: selectedAddress,
      selected: {
        value: selectedAddress,
        ethBalance: {
          value: selectedAddressEthBalance,
          isLoading: isLoadingUserEthBalance,
        },
        onChange: onChangeSelectedAddress,
      },
    },
    isActionPending,
    onCTAClick,
  };
};

export default useTokenTradeForm;
