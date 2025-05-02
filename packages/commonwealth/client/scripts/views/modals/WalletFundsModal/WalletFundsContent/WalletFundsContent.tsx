import { commonProtocol } from '@hicommonwealth/evm-protocols';
import React, { useState } from 'react';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useGetEthereumBalanceQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
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
  const [amount, setAmount] = useState('0.05');

  const {
    magic,
    userAddress,
    isLoading: isMagicLoading,
    showWalletInfo,
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

  const handleInputChange = (value: string): void => {
    const cleanValue = value.replace(/^0+(?=\d)/, '');
    if (value === '' || value === '0') {
      setAmount('0');
    } else {
      setAmount(cleanValue);
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
        <div className="amount-input-container">
          <CWTextInput
            type="number"
            value={amount}
            onInput={(e) => handleInputChange(e.target.value)}
            min={0}
            step={0.001}
          />
          <CWText type="b1" fontWeight="bold" className="amount-text">
            ETH
          </CWText>
        </div>

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
            onClick={() => console.log('Coinbase clicked')}
          />
          <FundWalletItem
            icon="barcode"
            title="View wallet information"
            onClick={showWalletInfo}
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
