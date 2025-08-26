import { WalletId } from '@hicommonwealth/shared';
import { MoonPayBuyWidget } from '@moonpay/moonpay-react';
import React, { useEffect, useState } from 'react';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useGetEthereumBalanceQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { trpc } from 'utils/trpcClient';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import useAuthentication from 'views/modals/AuthModal/useAuthentication';
import useMagicWallet from 'views/modals/WalletFundsModal/WalletFundsContent/useMagicWallet';
import {
  formatUsdBalance,
  handleRefreshBalance,
} from 'views/modals/WalletFundsModal/WalletFundsContent/utils';
import './MagicWalletButton.scss';

type MagicWalletButtonProps = {
  userSelectedAddress: string;
  selectedNetworkChainId: number;
};

const MagicWalletButton = ({
  userSelectedAddress,
  selectedNetworkChainId,
}: MagicWalletButtonProps) => {
  const user = useUserStore();

  const { openMagicWallet } = useAuthentication({});

  const isSelectedAddressMagic =
    user.addresses.find((a) => a.address === userSelectedAddress)?.walletId ===
    WalletId.Magic;

  const {
    magic,
    userAddress,
    isLoading: isMagicLoading,
  } = useMagicWallet({ chainId: selectedNetworkChainId });

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

  const handleCloseMoonpay = async () => {
    setIsMoonpayVisible(false);
    await handleRefreshBalance(refetch);
  };

  const onUrlSignatureRequested = async (url: string): Promise<string> => {
    try {
      const result = await utils.user.getMoonpaySignature.fetch({ url });
      return result?.signature || '';
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

  useEffect(() => {
    if (isBalanceLoading) return;
    refetch();
  }, [selectedNetworkChainId, refetch, isBalanceLoading]);

  if (!isSelectedAddressMagic) return <></>;

  return (
    <div className="MagicWalletButton">
      <CWText className="usd-value">
        {isLoading ? (
          <CWCircleMultiplySpinner />
        ) : (
          `Wallet Balance ${formattedBalanceUsd}`
        )}
      </CWText>
      <CWText type="caption" isCentered>
        Deposit, and manage your funds for via Magic and Moonpay.
      </CWText>
      <div className="button-container">
        <span>
          <CWIcon iconName="magic" />
        </span>
        <CWButton
          buttonType="secondary"
          buttonHeight="sm"
          buttonWidth="narrow"
          label="Manage Funds via Magic"
          onClick={() => {
            openMagicWallet(selectedNetworkChainId).catch(console.error);
          }}
        />
      </div>
      <div className="button-container">
        <span>
          <CWIcon iconName="moonpay" />
        </span>
        <CWButton
          buttonType="secondary"
          buttonHeight="sm"
          buttonWidth="narrow"
          label="Deposit Funds via Moonpay"
          onClick={() => {
            setIsMoonpayVisible(true);
          }}
        />
      </div>
      <MoonPayBuyWidget
        variant="overlay"
        visible={isMoonpayVisible}
        walletAddress={userAddress}
        onClose={handleCloseMoonpay}
        onUrlSignatureRequested={onUrlSignatureRequested}
        defaultCurrencyCode="eth_base"
      />
    </div>
  );
};

export default MagicWalletButton;
