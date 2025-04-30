import React, { useState } from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { FundWalletItem } from './FundWalletItem';

import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import './WalletFundsContent.scss';

const WalletFundsContent = () => {
  const [amount, setAmount] = useState('0.05');

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Remove leading zeros
    const cleanValue = value.replace(/^0+(?=\d)/, '');
    if (value === '' || value === '0') {
      setAmount('0');
    } else {
      setAmount(cleanValue);
    }
  };

  return (
    <div className="WalletFundsContent">
      <CWModalBody>
        <div className="amount-input-container">
          <CWTextInput
            type="number"
            value={amount}
            onInput={handleInput}
            min={0}
            step={0.001}
          />
          <CWText type="b1" fontWeight="bold" className="amount-text">
            ETH
          </CWText>
        </div>

        <CWText className="usd-value">$180.84 USD</CWText>
        <CWText className="refresh-link">Refresh Balance</CWText>

        <div className="fund-options">
          <FundWalletItem
            icon="coinbase"
            title="Coinbase OnRamp"
            onClick={() => console.log('Coinbase clicked')}
          />
          <FundWalletItem
            icon="moonpay"
            title="MoonPay"
            onClick={() => console.log('MoonPay clicked')}
          />
          <FundWalletItem
            icon="cardholder"
            title="Transfer from wallet"
            onClick={() => console.log('Transfer clicked')}
          />
          <FundWalletItem
            icon="barcode"
            title="View wallet information"
            onClick={() => console.log('View wallet information clicked')}
          />
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton label="Next" buttonWidth="full" type="submit" />
      </CWModalFooter>
    </div>
  );
};

export { WalletFundsContent };
