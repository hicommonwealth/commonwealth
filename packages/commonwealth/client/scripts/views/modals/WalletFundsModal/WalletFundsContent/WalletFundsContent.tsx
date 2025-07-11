import { commonProtocol } from '@hicommonwealth/evm-protocols';
import React from 'react';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useGetEthereumBalanceQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { FundWalletItem } from './FundWalletItem';
import useMagicWallet from './useMagicWallet';
import { formatUsdBalance, handleRefreshBalance } from './utils';

import './WalletFundsContent.scss';

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
            icon="barcode"
            title="View wallet information"
            onClick={handleShowWalletAddress}
          />
        </div>
      </CWModalBody>
      <CWModalFooter>
        <></>
      </CWModalFooter>
    </div>
  );
};

export { WalletFundsContent };
