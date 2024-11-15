import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { commonProtocol } from '@hicommonwealth/shared';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useMemo, useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { fetchCachedNodes } from 'state/api/nodes';
import useUserStore from 'state/ui/user';
import { z } from 'zod';
import { TradingMode, UseTradeTokenFormProps } from './types';
import useBuyTrade from './useBuyTrade';
import useSellTrade from './useSellTrade';

const COMMON_PLATFORM_FEE_PERCENTAGE = 5; // make configurable when needed

const useTradeTokenForm = ({
  tradeConfig,
  addressType,
  onTradeComplete,
}: UseTradeTokenFormProps) => {
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

  const { data: tokenCommunity, isLoading: isLoadingTokenCommunity } =
    useGetCommunityByIdQuery({
      id: tradeConfig.token.community_id,
      enabled: !!tradeConfig.token.community_id,
      includeNodeInfo: true,
    });

  useRunOnceOnCondition({
    callback: () => setSelectedAddress(userAddresses[0]),
    shouldRun: userAddresses.length > 0 && !selectedAddress,
  });

  const onTradingModeChange = (mode: TradingMode) => {
    setTradingMode(mode);
  };

  const onChangeSelectedAddress = (address: string) => {
    setSelectedAddress(address);
  };

  const {
    amounts: buyTradeAmounts,
    handleTokenBuy,
    isBuyActionPending,
    selectedAddressEthBalance,
  } = useBuyTrade({
    chainNode: baseNode,
    selectedAddress,
    commonFeePercentage: COMMON_PLATFORM_FEE_PERCENTAGE,
    tradeConfig,
    onTradeComplete,
    tokenCommunity: tokenCommunity as z.infer<typeof ExtendedCommunity>,
  });

  const {
    amounts: sellTradeAmounts,
    handleTokenSell,
    isSellActionPending,
    selectedAddressTokenBalance,
  } = useSellTrade({
    chainNode: baseNode,
    selectedAddress,
    commonFeePercentage: COMMON_PLATFORM_FEE_PERCENTAGE,
    tradeConfig,
    onTradeComplete,
    tokenCommunity: tokenCommunity as z.infer<typeof ExtendedCommunity>,
  });

  // flag to indicate if something is ongoing
  const isActionPending =
    isLoadingTokenCommunity || isBuyActionPending || isSellActionPending;

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
    // Note: not exporting state setters directly, all "buy/sell token"
    // business logic should be done (or exported from) in this hook
    trading: {
      amounts: {
        buy: buyTradeAmounts,
        sell: sellTradeAmounts,
      },
      mode: { value: tradingMode, onChange: onTradingModeChange },
      token: tradeConfig.token,
    },
    // TODO: add presets for max amounts?
    addresses: {
      available: userAddresses,
      default: selectedAddress,
      selected: {
        value: selectedAddress,
        balances: {
          eth: {
            value: selectedAddressEthBalance.value,
            isLoading: selectedAddressEthBalance.isLoading,
          },
          selectedToken: {
            value: selectedAddressTokenBalance.value,
            isLoading: selectedAddressTokenBalance.isLoading,
          },
        },
        onChange: onChangeSelectedAddress,
      },
    },
    isActionPending,
    onCTAClick,
  };
};

export default useTradeTokenForm;
