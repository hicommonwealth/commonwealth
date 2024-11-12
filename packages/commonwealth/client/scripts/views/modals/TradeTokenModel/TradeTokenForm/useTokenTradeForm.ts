import { commonProtocol } from '@hicommonwealth/shared';
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
import useUserStore from 'state/ui/user';
import './TradeTokenForm.scss';
import { TradingMode, UseTokenTradeFormProps } from './types';

const useTokenTradeForm = ({
  tradeConfig,
  addressType,
}: UseTokenTradeFormProps) => {
  // when tradeConfig.mode === TradingMode.Buy - trade amount represents value in tradeConfig.currency
  // when tradeConfig.mode === TradingMode.Sell - trade amount represents value in tradeConfig.token.symbol
  const [tradingAmount, setTradingAmount] = useState<number>(0);
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

  const ethBuyAmount = tradingAmount / ethToCurrencyRate;

  const { data: tokenCommunity, isLoading: isLoadingTokenCommunity } =
    useGetCommunityByIdQuery({
      id: tradeConfig.token.community_id,
      enabled: !!tradeConfig.token.community_id,
      includeNodeInfo: true,
    });

  // imp: this query uses CommunityStakes helper to get eth price, but its
  // a generic query so no need to initiate a separate Launhpad helper
  const {
    data: selectedAddressEthBalance,
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

  const onTradingAmountChange = (
    change: React.ChangeEvent<HTMLInputElement> | number,
  ) => {
    if (typeof change == 'number') {
      setTradingAmount(change);
    } else {
      const value = change.target.value;

      if (value === '') setTradingAmount(0);
      // verify only numbers with decimal (optional) are present
      else if (/^\d+(\.\d+)?$/.test(value)) setTradingAmount(parseFloat(value));
    }
  };

  const onTradingModeChange = (mode: TradingMode) => {
    setTradingMode(mode);
  };

  const onChangeSelectedAddress = (address: string) => {
    setSelectedAddress(address);
  };

  const handleTokenBuy = async () => {
    // this condition wouldn't be called, but adding to avoid typescript issues
    if (!baseNode?.url || !baseNode?.ethChainId || !selectedAddress) return;

    const payload = {
      chainRpc: baseNode.url,
      ethChainId: baseNode.ethChainId,
      amountEth: ethBuyAmount,
      walletAddress: selectedAddress,
      tokenAddress: tradeConfig.token.token_address,
    };
    console.log('buy payload => ', payload);
    const receipt = await buyToken(payload);
    console.log('receipt => ', receipt);
  };

  const handleTokenSell = async () => {
    // TODO: implement selling logic
  };

  // flag to indicate if something is ongoing
  const isActionPending =
    isLoadingTokenCommunity ||
    isLoadingUserEthBalance ||
    isBuyingToken ||
    isLoadingETHToCurrencyRate;

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
      amount: { value: tradingAmount, onChange: onTradingAmountChange },
      mode: { value: tradingMode, onChange: onTradingModeChange },
      currency: tradeConfig.currency,
      presetAmounts: tradeConfig.presetAmounts,
      ethAmounts: {
        buy: ethBuyAmount,
      },
    },
    addresses: {
      available: userAddresses,
      default: selectedAddress,
      selected: {
        value: selectedAddress,
        ethBalance: {
          value: selectedAddressEthBalance || `0.0`,
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
