import { WalletId } from '@hicommonwealth/shared';
import React, { useEffect, useState } from 'react';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useGetEthereumBalanceQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { WalletFundsModal } from 'views/modals/WalletFundsModal';
import useMagicWallet from 'views/modals/WalletFundsModal/WalletFundsContent/useMagicWallet';
import { formatUsdBalance } from 'views/modals/WalletFundsModal/WalletFundsContent/utils';
import './MagicWalletManager.scss';

type MagicWalletManagerProps = {
  userSelectedAddress: string;
  selectedNetworkChainId: number;
};

const MagicWalletManager = ({
  userSelectedAddress,
  selectedNetworkChainId,
}: MagicWalletManagerProps) => {
  const user = useUserStore();
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);

  const isSelectedAddressMagic =
    user.addresses.find((a) => a.address === userSelectedAddress)?.walletId ===
    WalletId.Magic;

  const {
    magic,
    userAddress,
    isLoading: isMagicLoading,
  } = useMagicWallet({ chainId: selectedNetworkChainId });

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
    <div className="MagicWalletManager">
      <CWText className="usd-value">
        {isLoading ? (
          <CWCircleMultiplySpinner />
        ) : (
          `Wallet Balance ${formattedBalanceUsd}`
        )}
      </CWText>
      <CWText type="caption" isCentered>
        Deposit, and manage funds for your magic wallet via Magic and Moonpay.
      </CWText>
      <CWButton
        iconLeft="walletNew"
        label="Open Wallet Manager"
        onClick={() => {
          setIsFundsModalOpen(true);
        }}
        buttonType="secondary"
        buttonHeight="med"
      />
      <CWModal
        size="medium"
        open={isFundsModalOpen}
        onClose={() => setIsFundsModalOpen(false)}
        content={
          <WalletFundsModal
            onClose={() => setIsFundsModalOpen(false)}
            chainId={selectedNetworkChainId}
          />
        }
      />
    </div>
  );
};

export default MagicWalletManager;
