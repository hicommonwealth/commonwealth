import { Community } from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useState } from 'react';
import {
  useBuyThreadTokenMutation,
  useCreateThreadTokenTradeMutation,
  useStoreThreadTokenMutation,
} from 'state/api/threads';
import useCreateThreadTokenMutation, {
  CreateThreadTokenProps,
} from 'state/api/threads/createThreadToken';
import { z } from 'zod';
import { useThreadTokenWidget } from './ToketWidget/useThreadTokenWidget';
interface UseLaunchAndBuyThreadTokenProps {
  tokenizedThreadsEnabled?: boolean;
  communityId?: string;
  addressType?: string;
  tokenCommunity?: z.infer<typeof Community>;
  threadTitle?: string;
  threadBody?: string;
}

export const launchAndBuyThreadTokenUtility = async ({
  threadId,
  threadTitle,
  threadBody,
  selectedAddress,
  primaryTokenAddress,
  ethChainId,
  chainRpc,
  tokenCommunity,
  communityId,
  createThreadToken,
  storeThreadToken,
  user,
  linkSpecificAddressToSpecificCommunity,
  tokenGainAmount = 0,
  amount = '0',
}: {
  threadId: number;
  threadTitle: string;
  threadBody: string;
  selectedAddress: string;
  primaryTokenAddress: string;
  ethChainId: number;
  chainRpc: string;
  tokenCommunity?: z.infer<typeof Community>;
  communityId: string;
  createThreadToken: (
    payload: CreateThreadTokenProps,
  ) => Promise<{ transactionHash: string }>;
  storeThreadToken: (payload: any) => Promise<unknown>;
  user: { addresses: Array<{ community: { id: string } }> };
  linkSpecificAddressToSpecificCommunity: (payload: any) => Promise<unknown>;
  tokenGainAmount?: number;
  amount?: string;
}) => {
  if (!selectedAddress) {
    throw new Error('Please connect your wallet first');
  }

  if (!threadTitle || !threadBody) {
    throw new Error('Please fill in thread title and body first');
  }

  if (!amount || parseFloat(amount) <= 0) {
    throw new Error('Please enter a valid amount');
  }

  if (tokenGainAmount < 0) {
    throw new Error('Invalid token gain amount');
  }

  if (
    !chainRpc ||
    !ethChainId ||
    !tokenCommunity ||
    !threadTitle ||
    !threadBody
  ) {
    throw new Error('Missing required data for transaction');
  }

  try {
    const tokenSymbol = threadTitle.substring(0, 5).toUpperCase();
    const initPurchaseAmount = Math.floor(parseFloat(amount) * 1e18);

    const createTokenPayload = {
      name: threadTitle,
      symbol: tokenSymbol,
      threadId,
      initPurchaseAmount,
      chainId: ethChainId,
      walletAddress: selectedAddress,
      authorAddress: selectedAddress,
      communityTreasuryAddress: selectedAddress,
      paymentTokenAddress: primaryTokenAddress,
      ethChainId,
      chainRpc,
    };

    const createTokenReceipt = await createThreadToken(createTokenPayload);

    try {
      await storeThreadToken({
        community_id: communityId,
        eth_chain_id: ethChainId,
        transaction_hash: createTokenReceipt.transactionHash,
      });
    } catch (error) {
      console.warn(
        'Failed to store thread token in database (block may not be indexed yet):',
        error,
      );
    }

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

    return {
      createTokenReceipt,
    };
  } catch (error) {
    console.error('Launch and buy error:', error);
    throw error;
  }
};

export const useLaunchAndBuyThreadToken = ({
  tokenizedThreadsEnabled = false,
  communityId,
  addressType,
  tokenCommunity,
  threadTitle,
  threadBody,
}: UseLaunchAndBuyThreadTokenProps) => {
  const [threadFormAmount, setThreadFormAmount] = useState<string>('0');
  const [threadFormTokenGainAmount, setThreadFormTokenGainAmount] =
    useState<number>(0);
  const [isLoadingThreadFormTokenGain, setIsLoadingThreadFormTokenGain] =
    useState<boolean>(false);

  const {
    selectedAddress,
    primaryTokenAddress,
    ethChainId,
    chainRpc,
    primaryTokenSymbol,
    userBalance,
    isLoadingBalance,
    isWrongNetwork,
    promptNetworkSwitch,
    tokenLaunchpad,
    user,
    linkSpecificAddressToSpecificCommunity,
    isPrimaryTokenConfigured,
  } = useThreadTokenWidget({
    tokenizedThreadsEnabled,
    addressType,
    tokenCommunity,
  });

  const { mutateAsync: createThreadToken, isPending: isCreatingThreadToken } =
    useCreateThreadTokenMutation();
  const { mutateAsync: buyThreadToken, isPending: isBuying } =
    useBuyThreadTokenMutation();
  const { mutateAsync: createTokenTrade, isPending: isCreatingTokenTrade } =
    useCreateThreadTokenTradeMutation();
  const { mutateAsync: storeThreadToken, isPending: isStoringThreadToken } =
    useStoreThreadTokenMutation();

  const calculateTokenGain = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setThreadFormTokenGainAmount(0);
      return;
    }

    try {
      setIsLoadingThreadFormTokenGain(true);
      const inputAmount = parseFloat(amount);
      const amountInWei = inputAmount * 1e18;

      if (tokenLaunchpad) {
        try {
          const amountOut = await tokenLaunchpad.getAmountOut(
            '', // token address will be empty for launch
            Math.floor(amountInWei),
            true,
            `${ethChainId}`,
          );
          setThreadFormTokenGainAmount(amountOut);
        } catch (error) {
          console.warn(
            'Could not calculate exact token gain for new token, setting to zero:',
            error,
          );
          setThreadFormTokenGainAmount(0);
        }
      }
    } catch (error) {
      console.error('Error calculating token gain:', error);
      setThreadFormTokenGainAmount(0);
    } finally {
      setIsLoadingThreadFormTokenGain(false);
    }
  };

  const launchAndBuyThreadToken = async (threadId: number) => {
    try {
      const result = await launchAndBuyThreadTokenUtility({
        threadId,
        threadTitle: threadTitle || '',
        threadBody: threadBody || '',
        selectedAddress,
        primaryTokenAddress,
        ethChainId,
        chainRpc,
        tokenCommunity: tokenCommunity!,
        communityId: communityId || '',
        createThreadToken,
        storeThreadToken,
        user,
        linkSpecificAddressToSpecificCommunity,
        tokenGainAmount: threadFormTokenGainAmount,
        amount: threadFormAmount,
      });

      notifySuccess('Thread token launched and purchased successfully!');
      setThreadFormAmount('0');
      return result;
    } catch (error) {
      notifyError('Failed to launch and buy thread token');
      throw error;
    }
  };

  return {
    // Thread form states for token purchase
    threadFormAmount,
    setThreadFormAmount,
    threadFormTokenGainAmount,
    isLoadingThreadFormTokenGain,

    // Data from thread token widget hook
    selectedAddress,
    primaryTokenAddress,
    ethChainId,
    chainRpc,
    primaryTokenSymbol,
    userBalance,
    isLoadingBalance,

    // Mutations
    createThreadToken,
    buyThreadToken,
    createTokenTrade,
    storeThreadToken,
    isCreatingThreadToken,
    isBuying,
    isCreatingTokenTrade,
    isStoringThreadToken,

    // Network
    isWrongNetwork,
    promptNetworkSwitch,

    // Contract
    tokenLaunchpad,

    // User
    user,
    linkSpecificAddressToSpecificCommunity,

    // Configuration
    isPrimaryTokenConfigured,

    // Functions
    calculateTokenGain,
    launchAndBuyThreadToken,
  };
};
