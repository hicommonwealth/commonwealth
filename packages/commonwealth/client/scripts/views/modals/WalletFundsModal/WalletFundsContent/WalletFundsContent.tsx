import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { FundWalletItem } from './FundWalletItem';

import './WalletFundsContent.scss';

const WalletFundsContent = () => {
  return (
    <div className="WalletFundsContent">
      <CWModalBody>
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
            title="Scan QR code"
            onClick={() => console.log('Scan QR code clicked')}
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
