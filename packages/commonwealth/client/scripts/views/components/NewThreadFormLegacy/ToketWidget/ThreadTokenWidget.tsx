import { Community } from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useEffect, useMemo, useState } from 'react';
import { useCreateThreadTokenTradeMutation } from 'state/api/threads';
import { useGetERC20BalanceQuery } from 'state/api/tokens';
import FractionalValue from 'views/components/FractionalValue';
import { z } from 'zod';
import { PopoverMenu } from '../../component_kit/CWPopoverMenu';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import { useLaunchAndBuyThreadToken } from '../useLaunchAndBuyThreadToken';
import './ThreadTokenWidget.scss';
import { useThreadTokenWidget } from './useThreadTokenWidget';

interface ThreadTokenWidgetProps {
  tokenizedThreadsEnabled?: boolean;
  threadId?: number;
  communityId?: string;
  addressType?: string;
  tokenCommunity?: z.infer<typeof Community>;
  threadTitle?: string;
  threadBody?: string;
  onThreadCreated?: (
    threadId: number,
    amount: string,
    tokenGainAmount: number,
  ) => void | Promise<void>;
}

type BuyCurrency = 'ETH' | 'COMMON' | 'PRIMARY';

interface CurrencyOption {
  type: BuyCurrency;
  symbol: string;
  address: string;
}

const ThreadTokenWidget = ({
  tokenizedThreadsEnabled = false,
  threadId,
  communityId,
  addressType,
  tokenCommunity,
  threadTitle,
  threadBody,
  onThreadCreated,
}: ThreadTokenWidgetProps) => {
  const isThreadCreationMode = !threadId;
  const [selectedBuyCurrency, setSelectedBuyCurrency] =
    useState<BuyCurrency>('PRIMARY');

  const threadTokenWidgetHook = useThreadTokenWidget({
    tokenizedThreadsEnabled,
    threadId,
    addressType,
    tokenCommunity,
  });

  const launchAndBuyHook = useLaunchAndBuyThreadToken({
    tokenizedThreadsEnabled,
    communityId,
    addressType,
    tokenCommunity,
    threadTitle,
    threadBody,
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
    isBuying,
    isCreatingTokenTrade,
    isWrongNetwork,
    promptNetworkSwitch,
    tokenLaunchpad,
    user,
    linkSpecificAddressToSpecificCommunity,
    isPrimaryTokenConfigured,
  } = isThreadCreationMode ? launchAndBuyHook : threadTokenWidgetHook;

  const {
    threadFormAmount,
    setThreadFormAmount,
    threadFormTokenGainAmount,
    isLoadingThreadFormTokenGain,
    calculateTokenGain,
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
  const setCurrentTokenGainAmount = useMemo(
    () => (isThreadCreationMode ? (_val: number) => {} : setTokenGainAmount),
    [isThreadCreationMode, setTokenGainAmount],
  );
  const currentIsLoadingTokenGain = isThreadCreationMode
    ? isLoadingThreadFormTokenGain
    : isLoadingTokenGain;
  const setCurrentIsLoadingTokenGain = useMemo(
    () =>
      isThreadCreationMode ? (_val: boolean) => {} : setIsLoadingTokenGain,
    [isThreadCreationMode, setIsLoadingTokenGain],
  );

  const safeCurrentAmount = currentAmount || '0';
  const safeCurrentTokenGainAmount = currentTokenGainAmount || 0;

  const safeSetCurrentAmount = setCurrentAmount || (() => {});

  // TODO 13191: test with base network
  const COMMON_TOKEN_ADDRESS = '0x4c87da04887a1F9F21F777E3A8dD55C3C9f84701';

  // Get WETH address based on chain ID
  // WETH addresses for different chains
  const getWETHAddress = (chainId: number): string => {
    const wethAddresses: Record<number, string> = {
      1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum Mainnet
      8453: '0x4200000000000000000000000000000000000006', // Base
      84532: '0x4200000000000000000000000000000000000006', // Base Sepolia (same as Base)
      10: '0x4200000000000000000000000000000000000006', // Optimism
      42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum
      56: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // BSC
    };
    return wethAddresses[chainId] || ZERO_ADDRESS;
  };

  const wethAddress = useMemo(() => getWETHAddress(ethChainId), [ethChainId]);

  // Define available buy currencies
  const currencyOptions: CurrencyOption[] = useMemo(() => {
    const options: CurrencyOption[] = [
      {
        type: 'ETH',
        symbol: 'WETH',
        address: wethAddress,
      },
    ];

    // Add COMMON token if address is available
    if (COMMON_TOKEN_ADDRESS) {
      options.push({
        type: 'COMMON',
        symbol: 'COMMON',
        address: COMMON_TOKEN_ADDRESS,
      });
    }

    // Add primary token (the pre-selected one)
    if (primaryTokenAddress && primaryTokenSymbol) {
      options.push({
        type: 'PRIMARY',
        symbol: primaryTokenSymbol,
        address: primaryTokenAddress,
      });
    }

    return options;
  }, [
    primaryTokenAddress,
    primaryTokenSymbol,
    COMMON_TOKEN_ADDRESS,
    wethAddress,
  ]);

  // Get selected currency details
  const selectedCurrency = useMemo(() => {
    return (
      currencyOptions.find((opt) => opt.type === selectedBuyCurrency) ||
      currencyOptions[0]
    );
  }, [currencyOptions, selectedBuyCurrency]);

  // Get payment token address based on selected currency
  const paymentTokenAddress = useMemo(() => {
    return selectedCurrency?.address || primaryTokenAddress;
  }, [selectedCurrency, primaryTokenAddress]);

  // Get currency symbol for display
  const displayCurrencySymbol = useMemo(() => {
    if (isThreadCreationMode || !isSellMode) {
      return selectedCurrency?.symbol || primaryTokenSymbol;
    }
    return threadToken?.symbol || 'TOKEN';
  }, [
    isThreadCreationMode,
    isSellMode,
    selectedCurrency,
    primaryTokenSymbol,
    threadToken,
  ]);

  // Fetch balance for selected currency
  // For WETH, we fetch the ERC20 balance
  const {
    data: selectedCurrencyTokenBalance = '0.0',
    isLoading: isLoadingSelectedCurrencyTokenBalance,
  } = useGetERC20BalanceQuery({
    nodeRpc: chainRpc,
    tokenAddress: paymentTokenAddress,
    userAddress: selectedAddress,
    enabled:
      tokenizedThreadsEnabled &&
      !!selectedAddress &&
      !!paymentTokenAddress &&
      !!chainRpc &&
      !isSellMode,
  });

  // Get balance for selected currency
  const selectedCurrencyBalance = useMemo(() => {
    if (isSellMode) {
      return userTokenBalance;
    }
    return selectedCurrencyTokenBalance;
  }, [isSellMode, selectedCurrencyTokenBalance, userTokenBalance]);

  const isLoadingSelectedCurrencyBalance = useMemo(() => {
    if (isSellMode) {
      return isLoadingTokenBalance;
    }
    return isLoadingSelectedCurrencyTokenBalance;
  }, [
    isSellMode,
    isLoadingSelectedCurrencyTokenBalance,
    isLoadingTokenBalance,
  ]);

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
    setCurrentIsLoadingTokenGain,
    setCurrentTokenGainAmount,
  ]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      safeSetCurrentAmount(value);
    }
  };

  const handlePresetClick = (presetAmount: string) => {
    if (presetAmount === 'MAX') {
      safeSetCurrentAmount(
        isSellMode ? userTokenBalance : selectedCurrencyBalance,
      );
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
        await onThreadCreated(0, safeCurrentAmount, safeCurrentTokenGainAmount);
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

    if (parseFloat(safeCurrentAmount) > parseFloat(selectedCurrencyBalance)) {
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
        paymentTokenAddress: paymentTokenAddress,
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
        paymentTokenAddress: paymentTokenAddress,
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

  const tokenSymbol =
    isThreadCreationMode || !isSellMode
      ? threadToken?.symbol || 'TOKEN'
      : primaryTokenSymbol;

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
                  ? isLoadingSelectedCurrencyBalance
                    ? 'Loading...'
                    : `${selectedCurrencyBalance} ${displayCurrencySymbol}`
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
                ? `${safeCurrentAmount} ${displayCurrencySymbol}`
                : `0.000 ${displayCurrencySymbol}`}
            </CWText>
            {!isSellMode && (
              <PopoverMenu
                menuItems={currencyOptions.map((option) => ({
                  type: 'default' as const,
                  label: option.symbol,
                  onClick: () => {
                    setSelectedBuyCurrency(option.type);
                  },
                }))}
                placement="bottom-end"
                modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
                renderTrigger={(onClick, isOpen) => (
                  <button
                    className="currency-dropdown-trigger"
                    onClick={onClick}
                    type="button"
                  >
                    <CWIcon
                      iconName={isOpen ? 'caretUp' : 'chevronDown'}
                      className="chevron-icon"
                    />
                  </button>
                )}
              />
            )}
            {isSellMode && (
              <CWIcon iconName="chevronDown" className="chevron-icon" />
            )}
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
          <CWText type="caption" className="receive-label">
            You receive
          </CWText>

          <FractionalValue
            value={safeCurrentTokenGainAmount}
            currencySymbol={tokenSymbol}
            symbolLast={true}
            type="caption"
            fontWeight="regular"
            className="receive-amount"
          />
        </div>

        <CWButton
          label={
            isThreadCreationMode ? 'Launch + Buy' : isSellMode ? 'Sell' : 'Buy'
          }
          buttonType="primary"
          buttonWidth="full"
          onClick={() => {
            if (isThreadCreationMode) {
              void handleBuyClick();
            } else if (isSellMode) {
              void handleSellClick();
            } else {
              void handleBuyClick();
            }
          }}
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
                  ? selectedCurrencyBalance
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
