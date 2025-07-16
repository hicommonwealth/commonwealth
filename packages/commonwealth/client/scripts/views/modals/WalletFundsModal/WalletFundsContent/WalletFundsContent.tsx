import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { MoonPayBuyWidget } from '@moonpay/moonpay-react';
import React, { useState } from 'react';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useFetchPublicEnvVarQuery } from 'state/api/configuration';
import { useGetEthereumBalanceQuery } from 'state/api/tokens';
import { trpc } from 'utils/trpcClient';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { FundWalletItem } from './FundWalletItem';
import useMagicWallet from './useMagicWallet';
import { formatUsdBalance, handleRefreshBalance } from './utils';
import './WalletFundsContent.scss';

// Type guard to check for ReactNativeWebView property
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isReactNativeWebView = (): boolean =>
  !!(window as any).ReactNativeWebView;

const BASE_MAINNET_CHAIN_ID = commonProtocol.ValidChains.Base;

interface WalletFundsContentProps {
  chainId?: number;
}

const WalletFundsContent = ({
  chainId = BASE_MAINNET_CHAIN_ID,
}: WalletFundsContentProps = {}) => {
  const {
    magic,
    userAddress,
    isLoading: isMagicLoading,
  } = useMagicWallet({ chainId });

  const { data: configurationData } = useFetchPublicEnvVarQuery();

  const [isMoonpayVisible, setIsMoonpayVisible] = useState(false);
  const utils = trpc.useUtils();

  const {
    data: userBalance = '0',
    isLoading: isBalanceLoading,
    refetch,
  } = useGetEthereumBalanceQuery({
    userAddress,
    rpcProvider: magic?.rpcProvider,
    enabled: !!userAddress && !!magic?.rpcProvider,
  });

  const { data: ethToCurrencyRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: 'ETH',
  });

  const handleShowWalletAddress = async (): Promise<void> => {
    if (magic) {
      try {
        await magic.wallet.showAddress();
      } catch (error) {
        console.error('Error showing wallet address:', error);
      }
    }
  };

  const handleShowOnRamp = async (): Promise<void> => {
    if (magic) {
      try {
        await magic.wallet.showOnRamp();
      } catch (error) {
        console.error('Error showing on-ramp:', error);
      }
    }
  };

  const handleShowMoonpay = async () => {
    // If we're in a react native webview, post a message to the host app
    if (isReactNativeWebView() && userAddress) {
      const moonpayUrl = `https://buy-sandbox.moonpay.com?apiKey=${
        configurationData?.MOONPAY_PUBLISHABLE_KEY
      }&walletAddress=${userAddress}&currencyCode=eth`;

      const signedUrl = await onUrlSignatureRequested(moonpayUrl);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'MOONPAY_OPEN', url: signedUrl }),
      );
    } else {
      setIsMoonpayVisible(true);
    }
  };

  const handleCloseMoonpay = async () => {
    setIsMoonpayVisible(false);
    handleRefreshBalance(refetch);
  };

  const onUrlSignatureRequested = async (url: string): Promise<string> => {
    try {
      const result = await utils.user.getMoonpaySignature.fetch({ url });
      console.log('result', result);
      return result.signature;
    } catch (error) {
      console.error('Failed to get MoonPay signature:', error);
      throw new Error('Failed to get signature');
    }
  };

  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );

  const formattedBalanceUsd = formatUsdBalance(userBalance, ethToUsdRate);
  const isLoading = isMagicLoading || isBalanceLoading;

  return (
    <div className="WalletFundsContent">
      <CWModalBody>
        <CWText className="usd-value">
          {isLoading ? 'Loading...' : formattedBalanceUsd}
        </CWText>
        <CWText
          className="refresh-link"
          onClick={() => handleRefreshBalance(refetch)}
          role="button"
        >
          Refresh Balance
        </CWText>

        <div className="fund-options">
          <FundWalletItem
            icon="coinbase"
            title="Coinbase OnRamp"
            onClick={handleShowOnRamp}
          />
          <FundWalletItem
            icon="moonpay"
            title="Moonpay"
            onClick={handleShowMoonpay}
          />
          <FundWalletItem
            icon="barcode"
            title="View wallet information"
            onClick={handleShowWalletAddress}
          />
        </div>
      </CWModalBody>
      <CWModalFooter>
        <></>
      </CWModalFooter>
      <MoonPayBuyWidget
        variant="overlay"
        visible={isMoonpayVisible}
        walletAddress={userAddress}
        onClose={handleCloseMoonpay}
        onUrlSignatureRequested={onUrlSignatureRequested}
        currencyCode="eth"
      />
    </div>
  );
};

export { WalletFundsContent };
