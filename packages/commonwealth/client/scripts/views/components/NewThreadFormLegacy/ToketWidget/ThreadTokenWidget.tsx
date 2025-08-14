import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useEffect } from 'react';
import { useCreateThreadTokenTradeMutation } from 'state/api/threads';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import { useLaunchAndBuyThreadToken } from '../useLaunchAndBuyThreadToken';
import './ThreadTokenWidget.scss';
import { useThreadTokenWidget } from './useThreadTokenWidget';

interface ThreadTokenWidgetProps {
  tokenizedThreadsEnabled?: boolean;
  selectedTopicId?: number;
  threadId?: number;
  communityId?: string;
  addressType?: string;
  chainNode?: any;
  tokenCommunity?: any;
  threadTitle?: string;
  threadBody?: string;
  onThreadCreated?: (
    threadId: number,
    amount: string,
    tokenGainAmount: number,
  ) => void;
}

const ThreadTokenWidget = ({
  tokenizedThreadsEnabled = false,
  selectedTopicId,
  threadId,
  communityId,
  addressType,
  chainNode,
  tokenCommunity,
  threadTitle,
  threadBody,
  onThreadCreated,
}: ThreadTokenWidgetProps) => {
  const isThreadCreationMode = !threadId;

  const threadTokenWidgetHook = useThreadTokenWidget({
    tokenizedThreadsEnabled,
    threadId,
    communityId,
    addressType,
    chainNode,
    tokenCommunity,
  });

  const launchAndBuyHook = useLaunchAndBuyThreadToken({
    tokenizedThreadsEnabled,
    communityId,
    addressType,
    chainNode,
    tokenCommunity,
    threadTitle,
    threadBody,
    selectedTopicId,
  });

  const {
    amount,
    setAmount,
    tokenGainAmount,
    setTokenGainAmount,
    isLoadingTokenGain,
    setIsLoadingTokenGain,
    isSellMode,
    setIsSellMode,
    threadToken,
    isLoadingThreadToken,
    userTokenBalance,
    isLoadingTokenBalance,
    buyThreadToken,
    sellThreadToken,
    isSelling,
  } = threadTokenWidgetHook;

  const {
    selectedAddress,
    primaryTokenAddress,
    ethChainId,
    chainRpc,
    primaryTokenSymbol,
    userBalance,
    isLoadingBalance,
    createTokenTrade,
    isBuying,
    isCreatingTokenTrade,
    isWrongNetwork,
    promptNetworkSwitch,
    tokenLaunchpad,
    user,
    linkSpecificAddressToSpecificCommunity,
    isPrimaryTokenConfigured,
  } = isThreadCreationMode ? launchAndBuyHook : threadTokenWidgetHook;

  const { tokenMetadata, primaryTokenRateData } = threadTokenWidgetHook;

  const {
    threadFormAmount,
    setThreadFormAmount,
    threadFormTokenGainAmount,
    isLoadingThreadFormTokenGain,
    calculateTokenGain,
    launchAndBuyThreadToken,
    isCreatingThreadToken,
  } = isThreadCreationMode ? launchAndBuyHook : {};

  const { mutateAsync: createThreadTokenTrade } =
    useCreateThreadTokenTradeMutation();

  const currentAmount = isThreadCreationMode ? threadFormAmount : amount;
  const setCurrentAmount = isThreadCreationMode
    ? setThreadFormAmount
    : setAmount;
  const currentTokenGainAmount = isThreadCreationMode
    ? threadFormTokenGainAmount
    : tokenGainAmount;
  const setCurrentTokenGainAmount = isThreadCreationMode
    ? (val: number) => {}
    : setTokenGainAmount;
  const currentIsLoadingTokenGain = isThreadCreationMode
    ? isLoadingThreadFormTokenGain
    : isLoadingTokenGain;
  const setCurrentIsLoadingTokenGain = isThreadCreationMode
    ? (val: boolean) => {}
    : setIsLoadingTokenGain;

  const safeCurrentAmount = currentAmount || '0';
  const safeCurrentTokenGainAmount = currentTokenGainAmount || 0;
  const safeSetCurrentAmount = setCurrentAmount || (() => {});

  useEffect(() => {
    const fetchTokenGain = async () => {
      if (
        !tokenLaunchpad ||
        !safeCurrentAmount ||
        parseFloat(safeCurrentAmount) <= 0 ||
        (isThreadCreationMode ? false : !threadToken?.token_address)
      ) {
        setCurrentTokenGainAmount(0);
        return;
      }

      try {
        setCurrentIsLoadingTokenGain(true);
        const inputAmount = parseFloat(safeCurrentAmount);
        const amountInWei = inputAmount * 1e18;

        if (isThreadCreationMode) {
          await calculateTokenGain?.(safeCurrentAmount);
        } else {
          const tokenAddress = threadToken?.token_address;
          if (!tokenAddress) {
            console.warn(
              'No valid token address found for token gain calculation',
            );
            setCurrentTokenGainAmount(0);
            return;
          }

          const amountOut = await tokenLaunchpad.getAmountOut(
            String(tokenAddress),
            amountInWei,
            !isSellMode,
            `${ethChainId}`,
          );
          setCurrentTokenGainAmount(amountOut);
        }
      } catch (error) {
        console.error('Error calculating token gain:', error);
        setCurrentTokenGainAmount(0);
      } finally {
        setCurrentIsLoadingTokenGain(false);
      }
    };

    void fetchTokenGain();
  }, [
    safeCurrentAmount,
    tokenLaunchpad,
    threadToken?.token_address,
    ethChainId,
    isSellMode,
    isThreadCreationMode,
    calculateTokenGain,
  ]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      safeSetCurrentAmount(value);
    }
  };

  const handlePresetClick = (presetAmount: string) => {
    if (presetAmount === 'MAX') {
      safeSetCurrentAmount(isSellMode ? userTokenBalance : userBalance);
    } else {
      safeSetCurrentAmount(presetAmount);
    }
  };

  const handleBuyClick = async () => {
    if (isThreadCreationMode) {
      if (!threadTitle || !threadBody) {
        notifyError('Please fill in thread title and body first');
        return;
      }

      if (onThreadCreated) {
        onThreadCreated(0, safeCurrentAmount, safeCurrentTokenGainAmount);
      }
      return;
    }

    if (!selectedAddress) {
      notifyError('Please connect your wallet first');
      return;
    }

    if (isWrongNetwork) {
      void promptNetworkSwitch();
      return;
    }

    if (!safeCurrentAmount || parseFloat(safeCurrentAmount) <= 0) {
      notifyError('Please enter a valid amount');
      return;
    }

    if (parseFloat(safeCurrentAmount) > parseFloat(userBalance)) {
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
      const amountInWei = parseFloat(safeCurrentAmount) * 1e18;
      const minAmountOut = safeCurrentTokenGainAmount * 0.95 * 1e18;

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

      await createThreadTokenTrade({
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
      safeSetCurrentAmount('0');
    } catch (error) {
      notifyError('Failed to purchase thread token');
      console.error('Purchase error:', error);
    }
  };

  const handleSellClick = async () => {
    if (isThreadCreationMode) {
      notifyError('Cannot sell tokens before thread is created');
      return;
    }

    if (!selectedAddress) {
      notifyError('Please connect your wallet first');
      return;
    }

    if (isWrongNetwork) {
      void promptNetworkSwitch();
      return;
    }

    if (!safeCurrentAmount || parseFloat(safeCurrentAmount) <= 0) {
      notifyError('Please enter a valid amount');
      return;
    }

    if (parseFloat(safeCurrentAmount) > parseFloat(userTokenBalance)) {
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
      const amountToken = parseFloat(safeCurrentAmount) * 1e18;

      const payload = {
        chainRpc,
        ethChainId,
        tokenAddress: String(threadToken.token_address),
        amountToken: amountToken,
        walletAddress: selectedAddress,
        paymentTokenAddress: primaryTokenAddress,
      };

      const txReceipt = await sellThreadToken(payload);

      await createThreadTokenTrade({
        eth_chain_id: ethChainId,
        transaction_hash: txReceipt.transactionHash,
      });

      notifySuccess('Thread token sold successfully!');
      safeSetCurrentAmount('0');
    } catch (error) {
      notifyError('Failed to sell thread token');
      console.error('Sell error:', error);
    }
  };

  if (!tokenizedThreadsEnabled) {
    return null;
  }

  if (!isPrimaryTokenConfigured) {
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

  if (!tokenLaunchpad) {
    return (
      <div className="ThreadTokenWidget">
        <div className="wallet-connection-message">
          <CWText type="b2" className="message-text">
            Thread token trading is not available on this network.
          </CWText>
        </div>
      </div>
    );
  }

  const shouldShowSellMode = !isThreadCreationMode;

  return (
    <div className="ThreadTokenWidget">
      <div className="purchase-token-card">
        <div className="header">
          <div className="title-section">
            <CWText type="h4" fontWeight="semiBold">
              {isThreadCreationMode
                ? 'Launch + Buy Token'
                : isSellMode
                  ? 'Sell Token'
                  : 'Purchase Token'}
            </CWText>
            {shouldShowSellMode && (
              <div
                className="swap-icon-container"
                onClick={() => setIsSellMode(!isSellMode)}
              >
                <CWIcon iconName="arrowRightPhosphor" className="swap-icon" />
                <CWIcon iconName="arrowLeftPhosphor" className="swap-icon" />
              </div>
            )}
          </div>

          <div className="balance-section">
            <CWText type="b2" className="balance-label">
              Current balance
            </CWText>
            <div className="balance-amount">
              <CWText type="caption" fontWeight="regular">
                {isThreadCreationMode || !isSellMode
                  ? isLoadingBalance
                    ? 'Loading...'
                    : `${userBalance} ${primaryTokenSymbol}`
                  : isLoadingTokenBalance
                    ? 'Loading...'
                    : `${userTokenBalance} ${threadToken?.symbol || 'TOKEN'}`}
              </CWText>
            </div>
          </div>
        </div>

        <div className="amount-input-section">
          <input
            type="text"
            value={safeCurrentAmount}
            onChange={handleAmountChange}
            placeholder="0"
            className="amount-input"
          />
          <div className="input-currency">
            <CWText type="b2">
              {parseFloat(safeCurrentAmount) > 0
                ? `${safeCurrentAmount} ${isThreadCreationMode || !isSellMode ? primaryTokenSymbol : threadToken?.symbol || 'TOKEN'}`
                : `0.000 ${isThreadCreationMode || !isSellMode ? primaryTokenSymbol : threadToken?.symbol || 'TOKEN'}`}
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
            {currentIsLoadingTokenGain
              ? 'Calculating...'
              : `${safeCurrentTokenGainAmount.toFixed(2)} ${isThreadCreationMode || !isSellMode ? 'TOKEN' : primaryTokenSymbol}`}
          </CWText>
        </div>

        <CWButton
          label={
            isThreadCreationMode ? 'Launch + Buy' : isSellMode ? 'Sell' : 'Buy'
          }
          buttonType="primary"
          buttonWidth="full"
          onClick={
            isThreadCreationMode
              ? handleBuyClick
              : isSellMode
                ? handleSellClick
                : handleBuyClick
          }
          disabled={
            (isThreadCreationMode
              ? isCreatingThreadToken
              : isSellMode
                ? isSelling
                : isBuying) ||
            isCreatingTokenTrade ||
            parseFloat(safeCurrentAmount) <= 0 ||
            parseFloat(safeCurrentAmount) >
              parseFloat(
                isThreadCreationMode || !isSellMode
                  ? userBalance
                  : userTokenBalance,
              ) ||
            isWrongNetwork
          }
          className="buy-button"
        />
      </div>
    </div>
  );
};

export default ThreadTokenWidget;
