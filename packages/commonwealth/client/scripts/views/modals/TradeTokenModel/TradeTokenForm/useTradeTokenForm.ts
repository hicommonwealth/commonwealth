import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { commonProtocol } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useMemo, useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useSellTokenMutation from 'state/api/launchPad/sellToken';
import { fetchCachedNodes } from 'state/api/nodes';
import {
  useCreateTokenTradeMutation,
  useGetERC20BalanceQuery,
} from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { z } from 'zod';
import { TradingMode, UseTradeTokenFormProps } from './types';
import useBuyTrade from './useBuyTrade';

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

  const { mutateAsync: createTokenTrade, isLoading: isCreatingTokenTrade } =
    useCreateTokenTradeMutation();

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

  // sell mode logic start --- {
  const [tokenSellAmount, setTokenSellAmount] = useState<number>(0); // can be fractional

  const { mutateAsync: sellToken, isLoading: isSellingToken } =
    useSellTokenMutation();

  const handleTokenSell = async () => {
    try {
      // this condition wouldn't be called, but adding to avoid typescript issues
      if (
        !baseNode?.url ||
        !baseNode?.ethChainId ||
        !selectedAddress ||
        !tokenCommunity
      ) {
        return;
      }

      // buy token on chain
      const payload = {
        chainRpc: baseNode.url,
        ethChainId: baseNode.ethChainId,
        amountToken: tokenSellAmount * 1e18, // amount in wei // TODO
        walletAddress: selectedAddress,
        tokenAddress: tradeConfig.token.token_address,
      };
      const txReceipt = await sellToken(payload);

      // create token trade on db
      await createTokenTrade({
        eth_chain_id: baseNode?.ethChainId,
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

  const {
    data: selectedAddressTokenBalance = `0.0`,
    isLoading: isLoadingUserTokenBalance,
  } = useGetERC20BalanceQuery({
    nodeRpc: tokenCommunity?.ChainNode?.url || '',
    tokenAddress: tradeConfig.token.token_address,
    userAddress: selectedAddress || '',
  });

  const onTokenSellAmountChange = (
    change: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = change.target.value;

    if (value === '')
      setTokenSellAmount(0); // TODO: fix decimal
    // verify only numbers with decimal (optional) are present
    else if (/^\d*(\.\d+)?$/.test(value)) {
      setTokenSellAmount(parseFloat(value));
    }
  };
  // sell mode logic end --- }

  // flag to indicate if something is ongoing
  const isActionPending =
    isLoadingTokenCommunity ||
    isBuyActionPending ||
    isLoadingUserTokenBalance ||
    isSellingToken ||
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
        buy: buyTradeAmounts,
        sell: {
          invest: {
            // not to be confused with "Base" network on ethereum
            baseToken: {
              amount: tokenSellAmount,
              onAmountChange: onTokenSellAmountChange,
              unitEthExchangeRate: 100, // TODO: hardcoded for now - blocked token pricing
              toEth: 100, // TODO: hardcoded for now - blocked token pricing
            },
            insufficientFunds:
              tokenSellAmount > parseFloat(selectedAddressTokenBalance),
            commonPlatformFee: {
              percentage: `${COMMON_PLATFORM_FEE_PERCENTAGE}%`,
              eth: 100, // TODO: hardcoded for now - blocked token pricing
            },
          },
          gain: {
            eth: 100, // TODO: hardcoded for now - blocked token pricing
          },
        },
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
            value: selectedAddressTokenBalance,
            isLoading: isLoadingUserTokenBalance,
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
