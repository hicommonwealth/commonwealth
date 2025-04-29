import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';

import './WalletFundsContent.scss';

const WalletFundsContent = () => {
  return (
    <div className="WalletFundsContent">
      <CWModalBody>
        <CWText type="h4" fontWeight="semiBold">
          Wallet Funds
        </CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton label="Next" buttonWidth="full" type="submit" />
      </CWModalFooter>
    </div>
  );
};

export { WalletFundsContent };
