import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import TokenLaunchpad from 'helpers/ContractHelpers/tokenLaunchpad';
import { useNetworkSwitching } from 'hooks/useNetworkSwitching';
import React, { useEffect, useMemo, useState } from 'react';
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
} from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import './ThreadTokenWidget.scss';

interface ThreadTokenWidgetProps {
  tokenizedThreadsEnabled?: boolean;
  selectedTopicId?: number;
  threadId?: number;
  communityId?: string;
  addressType?: string;
  chainNode?: any;
  tokenCommunity?: any;
}

const ThreadTokenWidget = ({
  tokenizedThreadsEnabled = false,
  selectedTopicId,
  threadId,
  communityId,
  addressType,
  chainNode,
  tokenCommunity,
}: ThreadTokenWidgetProps) => {
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

  const primaryTokenSymbol = 'ETH';
  const primaryTokenAddress = tokenCommunity?.thread_purchase_token || '';
  const ethChainId = tokenCommunity?.ChainNode?.eth_chain_id || 1;
  const chainRpc = tokenCommunity?.ChainNode?.url || '';

  const { data: primaryTokenRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: primaryTokenSymbol,
    enabled: tokenizedThreadsEnabled && !!selectedAddress,
  });

  const { data: userBalance = '0.0', isLoading: isLoadingBalance } =
    useGetUserEthBalanceQuery({
      chainRpc,
      ethChainId,
      walletAddress: selectedAddress,
      apiEnabled: tokenizedThreadsEnabled && !!selectedAddress && !!chainRpc,
    });

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
      const factoryAddress = getFactoryContract(ethChainId).TokenLaunchpad;
      const bondingCurve = getFactoryContract(ethChainId).TokenBondingCurve;
      const paymentTokenAddress = primaryTokenAddress;

      return new TokenLaunchpad(
        factoryAddress,
        bondingCurve,
        paymentTokenAddress,
        chainRpc,
      );
    }
    return null;
  }, [
    chainRpc,
    ethChainId,
    selectedAddress,
    tokenCommunity,
    tokenizedThreadsEnabled,
  ]);

  useEffect(() => {
    const fetchTokenGain = async () => {
      if (
        !tokenLaunchpad ||
        !amount ||
        parseFloat(amount) <= 0 ||
        !threadToken?.token_address
      ) {
        setTokenGainAmount(0);
        return;
      }

      try {
        setIsLoadingTokenGain(true);
        const inputAmount = parseFloat(amount);
        const amountInWei = inputAmount * 1e18;

        const amountOut = await tokenLaunchpad.getAmountOut(
          String(threadToken.token_address),
          amountInWei,
          !isSellMode, // true for buy, false for sell
          `${ethChainId}`,
        );
        setTokenGainAmount(amountOut);
      } catch (error) {
        console.error('Error calculating token gain:', error);
        setTokenGainAmount(0);
      } finally {
        setIsLoadingTokenGain(false);
      }
    };

    void fetchTokenGain();
  }, [
    amount,
    tokenLaunchpad,
    threadToken?.token_address,
    ethChainId,
    isSellMode,
  ]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handlePresetClick = (presetAmount: string) => {
    if (presetAmount === 'MAX') {
      setAmount(isSellMode ? userTokenBalance : userBalance);
    } else {
      setAmount(presetAmount);
    }
  };

  const handleBuyClick = async () => {
    if (!selectedAddress) {
      notifyError('Please connect your wallet first');
      return;
    }

    if (isWrongNetwork) {
      void promptNetworkSwitch();
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      notifyError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(userBalance)) {
      notifyError('Insufficient balance');
      return;
    }

    if (
      !chainRpc ||
      !ethChainId ||
      !tokenCommunity ||
      !threadToken?.token_address
    ) {
      notifyError('Missing required data for transaction');
      return;
    }

    try {
      const amountInWei = parseFloat(amount) * 1e18;
      const minAmountOut = tokenGainAmount * 0.95 * 1e18; // 5% slippage tolerance

      const payload = {
        chainRpc,
        ethChainId,
        tokenAddress: String(threadToken.token_address),
        amountIn: amountInWei,
        walletAddress: selectedAddress,
        minAmountOut: minAmountOut,
        paymentTokenAddress: primaryTokenAddress,
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
      setAmount('0');
    } catch (error) {
      notifyError('Failed to purchase thread token');
      console.error('Purchase error:', error);
    }
  };

  const handleSellClick = async () => {
    if (!selectedAddress) {
      notifyError('Please connect your wallet first');
      return;
    }

    if (isWrongNetwork) {
      void promptNetworkSwitch();
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      notifyError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(userTokenBalance)) {
      notifyError('Insufficient token balance');
      return;
    }

    if (
      !chainRpc ||
      !ethChainId ||
      !tokenCommunity ||
      !threadToken?.token_address
    ) {
      notifyError('Missing required data for transaction');
      return;
    }

    try {
      const amountToken = parseFloat(amount) * 1e18;

      const payload = {
        chainRpc,
        ethChainId,
        tokenAddress: String(threadToken.token_address),
        amountToken: amountToken,
        walletAddress: selectedAddress,
        paymentTokenAddress: primaryTokenAddress,
      };

      const txReceipt = await sellThreadToken(payload);

      await createTokenTrade({
        eth_chain_id: ethChainId,
        transaction_hash: txReceipt.transactionHash,
      });

      notifySuccess('Thread token sold successfully!');
      setAmount('0');
    } catch (error) {
      notifyError('Failed to sell thread token');
      console.error('Sell error:', error);
    }
  };

  if (!tokenizedThreadsEnabled) {
    return null;
  }

  if (!selectedAddress) {
    return (
      <div className="ThreadTokenWidget">
        <div className="wallet-connection-message">
          <CWText type="b2" className="message-text">
            Connect your wallet to trade thread tokens
          </CWText>
        </div>
      </div>
    );
  }

  return (
    <div className="ThreadTokenWidget">
      <div className="purchase-token-card">
        <div className="header">
          <div className="title-section">
            <CWText type="h4" fontWeight="semiBold">
              {isSellMode ? 'Sell Token' : 'Purchase Token'}
            </CWText>
            <div
              className="swap-icon-container"
              onClick={() => setIsSellMode(!isSellMode)}
            >
              <CWIcon iconName="arrowRightPhosphor" className="swap-icon" />
              <CWIcon iconName="arrowLeftPhosphor" className="swap-icon" />
            </div>
          </div>

          <div className="balance-section">
            <CWText type="b2" className="balance-label">
              Current balance
            </CWText>
            <div className="balance-amount">
              <CWText type="caption" fontWeight="regular">
                {isSellMode
                  ? isLoadingTokenBalance
                    ? 'Loading...'
                    : `${userTokenBalance} ${threadToken?.symbol || 'TOKEN'}`
                  : isLoadingBalance
                    ? 'Loading...'
                    : `${userBalance} ${primaryTokenSymbol}`}
              </CWText>
            </div>
          </div>
        </div>

        <div className="amount-input-section">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            className="amount-input"
          />
          <div className="input-currency">
            <CWText type="b2">
              {parseFloat(amount) > 0
                ? `${amount} ${isSellMode ? threadToken?.symbol || 'TOKEN' : primaryTokenSymbol}`
                : `0.000 ${isSellMode ? threadToken?.symbol || 'TOKEN' : primaryTokenSymbol}`}
            </CWText>
            <CWIcon iconName="chevronDown" className="chevron-icon" />
          </div>
        </div>

        <div className="preset-amounts">
          <CWButton
            label="0.01"
            buttonType="secondary"
            buttonWidth="narrow"
            onClick={() => handlePresetClick('0.01')}
          />
          <CWButton
            label="0.1"
            buttonType="secondary"
            buttonWidth="narrow"
            onClick={() => handlePresetClick('0.1')}
          />
          <CWButton
            label="MAX"
            buttonType="secondary"
            buttonWidth="narrow"
            onClick={() => handlePresetClick('MAX')}
          />
        </div>

        <div className="receive-section">
          <CWText type="b2" className="receive-label">
            You receive
          </CWText>
          <CWText type="h5" fontWeight="semiBold" className="receive-amount">
            {isLoadingTokenGain
              ? 'Calculating...'
              : `${tokenGainAmount.toFixed(2)} ${isSellMode ? primaryTokenSymbol : threadToken?.symbol || 'TOKEN'}`}
          </CWText>
        </div>

        <CWButton
          label={isSellMode ? 'Sell' : 'Buy'}
          buttonType="primary"
          buttonWidth="full"
          onClick={isSellMode ? handleSellClick : handleBuyClick}
          disabled={
            (isSellMode ? isSelling : isBuying) ||
            isCreatingTokenTrade ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) >
              parseFloat(isSellMode ? userTokenBalance : userBalance) ||
            isWrongNetwork
          }
          className="buy-button"
        />
      </div>
    </div>
  );
};

export default ThreadTokenWidget;
