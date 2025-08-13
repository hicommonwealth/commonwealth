import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import TokenLaunchpad from 'helpers/ContractHelpers/tokenLaunchpad';
import { useNetworkSwitching } from 'hooks/useNetworkSwitching';
import { useMemo, useState } from 'react';
import {
  useFetchTokenUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import {
  useBuyThreadTokenMutation,
  useSellThreadTokenMutation,
} from 'state/api/threads';
import {
  useCreateTokenTradeMutation,
  useGetERC20BalanceQuery,
  useGetThreadToken,
  useTokenMetadataQuery,
} from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';

interface UseThreadTokenWidgetProps {
  tokenizedThreadsEnabled?: boolean;
  threadId?: number;
  communityId?: string;
  addressType?: string;
  chainNode?: any;
  tokenCommunity?: any;
}

export const useThreadTokenWidget = ({
  tokenizedThreadsEnabled = false,
  threadId,
  communityId,
  addressType,
  chainNode,
  tokenCommunity,
}: UseThreadTokenWidgetProps) => {
  const [amount, setAmount] = useState<string>('0');
  const [tokenGainAmount, setTokenGainAmount] = useState<number>(0);
  const [isLoadingTokenGain, setIsLoadingTokenGain] = useState<boolean>(false);
  const [isSellMode, setIsSellMode] = useState<boolean>(false);

  const { data: threadToken, isLoading: isLoadingThreadToken } =
    useGetThreadToken({
      thread_id: threadId || 0,
      enabled: !!threadId,
    });

  const user = useUserStore();
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const selectedAddress = useMemo(() => {
    const userAddresses = user.addresses.filter((addr) =>
      addressType ? addr.community.base === addressType : true,
    );
    return userAddresses[0]?.address || '';
  }, [user.addresses, addressType]);

  const primaryTokenAddress = tokenCommunity?.thread_purchase_token || '';
  const ethChainId = tokenCommunity?.ChainNode?.eth_chain_id || 1;
  const chainRpc = tokenCommunity?.ChainNode?.url || '';

  const { data: tokenMetadata } = useTokenMetadataQuery({
    tokenId: primaryTokenAddress,
    nodeEthChainId: ethChainId,
    apiEnabled: !!primaryTokenAddress && !!ethChainId,
  });

  const primaryTokenSymbol = tokenMetadata?.symbol || 'ETH';

  const { data: primaryTokenRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: primaryTokenSymbol,
    enabled: tokenizedThreadsEnabled && !!selectedAddress,
  });

  const isPrimaryTokenEth =
    !primaryTokenAddress ||
    primaryTokenAddress === '0x0000000000000000000000000000000000000000';

  const { data: userEthBalance = '0.0', isLoading: isLoadingEthBalance } =
    useGetUserEthBalanceQuery({
      chainRpc,
      ethChainId,
      walletAddress: selectedAddress,
      apiEnabled:
        tokenizedThreadsEnabled &&
        !!selectedAddress &&
        !!chainRpc &&
        isPrimaryTokenEth,
    });

  const {
    data: userPrimaryTokenBalance = '0.0',
    isLoading: isLoadingPrimaryTokenBalance,
  } = useGetERC20BalanceQuery({
    nodeRpc: chainRpc,
    tokenAddress: primaryTokenAddress,
    userAddress: selectedAddress,
    enabled:
      tokenizedThreadsEnabled &&
      !!selectedAddress &&
      !!primaryTokenAddress &&
      !isPrimaryTokenEth,
  });

  const userBalance = isPrimaryTokenEth
    ? userEthBalance
    : userPrimaryTokenBalance;
  const isLoadingBalance = isPrimaryTokenEth
    ? isLoadingEthBalance
    : isLoadingPrimaryTokenBalance;

  const { data: userTokenBalance = '0.0', isLoading: isLoadingTokenBalance } =
    useGetERC20BalanceQuery({
      nodeRpc: chainRpc,
      tokenAddress: String(threadToken?.token_address || ''),
      userAddress: selectedAddress,
      enabled:
        tokenizedThreadsEnabled &&
        !!selectedAddress &&
        !!threadToken?.token_address,
    });

  const { mutateAsync: buyThreadToken, isPending: isBuying } =
    useBuyThreadTokenMutation();
  const { mutateAsync: sellThreadToken, isPending: isSelling } =
    useSellThreadTokenMutation();
  const { mutateAsync: createTokenTrade, isPending: isCreatingTokenTrade } =
    useCreateTokenTradeMutation();

  const { isWrongNetwork, promptNetworkSwitch } = useNetworkSwitching({
    ethChainId,
    rpcUrl: chainRpc,
    provider: undefined,
  });

  const tokenLaunchpad = useMemo(() => {
    if (
      chainRpc &&
      ethChainId &&
      selectedAddress &&
      tokenCommunity &&
      tokenizedThreadsEnabled
    ) {
      try {
        const factoryAddress = getFactoryContract(ethChainId).TokenLaunchpad;
        const bondingCurve = getFactoryContract(ethChainId).TokenBondingCurve;
        const paymentTokenAddress = primaryTokenAddress;

        return new TokenLaunchpad(
          factoryAddress,
          bondingCurve,
          paymentTokenAddress,
          chainRpc,
        );
      } catch (error) {
        console.warn(
          `TokenLaunchpad contracts not available on chain ${ethChainId}:`,
          error,
        );
        return null;
      }
    }
    return null;
  }, [
    chainRpc,
    ethChainId,
    selectedAddress,
    tokenCommunity,
    tokenizedThreadsEnabled,
  ]);

  const isPrimaryTokenConfigured = !!primaryTokenAddress;

  return {
    // State
    amount,
    setAmount,
    tokenGainAmount,
    setTokenGainAmount,
    isLoadingTokenGain,
    setIsLoadingTokenGain,
    isSellMode,
    setIsSellMode,

    // Data
    threadToken,
    isLoadingThreadToken,
    selectedAddress,
    primaryTokenAddress,
    ethChainId,
    chainRpc,
    tokenMetadata,
    primaryTokenSymbol,
    primaryTokenRateData,
    userBalance,
    isLoadingBalance,
    userTokenBalance,
    isLoadingTokenBalance,

    // Mutations
    buyThreadToken,
    sellThreadToken,
    createTokenTrade,
    isBuying,
    isSelling,
    isCreatingTokenTrade,

    // Network
    isWrongNetwork,
    promptNetworkSwitch,

    // Contract
    tokenLaunchpad,

    // User
    user,
    linkSpecificAddressToSpecificCommunity,

    isPrimaryTokenConfigured,
  };
};
