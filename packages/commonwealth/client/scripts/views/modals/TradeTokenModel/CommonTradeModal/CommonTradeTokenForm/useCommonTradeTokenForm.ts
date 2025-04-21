import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { useNetworkSwitching } from 'hooks/useNetworkSwitching';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useMemo, useState } from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useUserStore from 'state/ui/user';
import { z } from 'zod';
import { TradingMode } from '../../types';
import { UseCommonTradeTokenFormProps } from './types';
import useBuyTrade from './useBuyTrade';
import useSellTrade from './useSellTrade';

const COMMON_PLATFORM_FEE_PERCENTAGE = 1; // make configurable when needed

const useCommonTradeTokenForm = ({
  tradeConfig,
  addressType,
  onTradeComplete,
}: UseCommonTradeTokenFormProps) => {
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
  const baseNode = app.chain.meta.ChainNode as NodeInfo;

  const { data: tokenCommunity, isLoading: isLoadingTokenCommunity } =
    useGetCommunityByIdQuery({
      id: tradeConfig.token.community_id,
      enabled: !!tradeConfig.token.community_id,
      includeNodeInfo: true,
    });

  const ethChainId = tokenCommunity?.ChainNode?.eth_chain_id;
  const rpcUrl = tokenCommunity?.ChainNode?.url;

  const { isWrongNetwork, promptNetworkSwitch } = useNetworkSwitching({
    ethChainId,
    rpcUrl,
    // Provider is needed for network switching in non-Magic wallets,
    // but CommonTrade doesn't directly handle wallet connection UI like Uniswap modal.
    // We might need a different approach here if we want to *force*
    // connection before switching, or assume a provider exists.
    // For now, leaving provider as undefined, which might limit switching
    // capabilities for non-Magic users if they aren't already connected.
    provider: undefined, // TODO: Revisit provider handling for network switching
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
    enabled: tradingMode === TradingMode.Buy,
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
    enabled: tradingMode === TradingMode.Sell,
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

    if (isWrongNetwork) {
      void promptNetworkSwitch();
      return; // Prevent trade execution
    }

    switch (tradingMode) {
      case TradingMode.Buy:
        handleTokenBuy().catch(console.error);
        break;
      case TradingMode.Sell:
        handleTokenSell().catch(console.error);
        break;
      default:
        console.error(`Trading mode:${tradingMode} not implemented.`);
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

export default useCommonTradeTokenForm;
