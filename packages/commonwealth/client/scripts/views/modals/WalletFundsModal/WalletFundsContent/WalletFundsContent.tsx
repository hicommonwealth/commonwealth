import React, { useEffect, useState } from 'react';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useGetEthereumBalanceQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import { FundWalletItem } from './FundWalletItem';
import {
  fetchUserAddress,
  formatUsdBalance,
  handleRefreshBalance,
  magic,
} from './utils';

import './WalletFundsContent.scss';

const WalletFundsContent = () => {
  const [amount, setAmount] = useState('0.05');
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    const getUserAddress = async () => {
      const address = await fetchUserAddress();
      setUserAddress(address);
    };

    getUserAddress();
  }, []);

  const {
    data: userBalance = '0',
    isLoading,
    refetch,
  } = useGetEthereumBalanceQuery({
    userAddress,
    rpcProvider: magic.rpcProvider,
    enabled: !!userAddress,
  });

  const { data: ethToCurrencyRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: 'ETH',
  });

  const handleQrCodeClick = async (): Promise<void> => {
    await magic.wallet.showAddress();
  };

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
          {isLoading ? '' : formattedBalanceUsd}
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
            onClick={handleQrCodeClick}
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
