import React, { useState } from 'react';

import app from 'state';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';

import FundContestForm from './FundContestForm';

import './FundContestDrawer.scss';

interface FundContestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contestAddress: string;
}

const FundContestDrawer = ({
  isOpen,
  onClose,
  contestAddress,
}: FundContestDrawerProps) => {
  const addressOptions = app.user.activeAccounts.map((account) => ({
    value: String(account.address),
    label: account.address,
  }));

  const activeAccountOption = {
    value: String(app.user.activeAccount.address),
    label: app.user.activeAccount.address,
  };

  const [selectedAddress, setSelectedAddress] = useState(activeAccountOption);
  const [amountEth, setAmountEth] = useState('0');

  const userEthBalance = '113.456';
  const contestEthBalance = '56.102';
  const amountEthInUsd = '1.23';
  const amountError =
    (parseFloat(userEthBalance) < parseFloat(amountEth) &&
      'Not enough funds in wallet') ||
    (amountEth === '' && 'Please enter an amount') ||
    (parseFloat(amountEth) < 0 && 'Please enter non negative amount');
  const newContestBalanceInEth = '56.102';
  const newContestBalanceInUsd = '1.12';
  const transferFeesInEth = '1.12';
  const transferFeesInUsd = '56.102';

  const handleChangeEthAmount = (e) => {
    setAmountEth(e.target.value);
  };

  const handleTransferFunds = () => {
    console.log('transfer funds');
  };

  return (
    <div className="FundContestDrawer">
      <CWDrawer open={isOpen} onClose={onClose}>
        <CWDrawerTopBar onClose={onClose} />
        <div className="fund-contest-drawer-container">
          <FundContestForm
            onClose={onClose}
            handleTransferFunds={handleTransferFunds}
            amountEth={amountEth}
            amountError={amountError}
            handleChangeEthAmount={handleChangeEthAmount}
            selectedAddress={selectedAddress}
            onSetSelectedAddress={setSelectedAddress}
            addressOptions={addressOptions}
            userEthBalance={userEthBalance}
            contestEthBalance={contestEthBalance}
            amountEthInUsd={amountEthInUsd}
            newContestBalanceInEth={newContestBalanceInEth}
            newContestBalanceInUsd={newContestBalanceInUsd}
            transferFeesInEth={transferFeesInEth}
            transferFeesInUsd={transferFeesInUsd}
            contestAddress={contestAddress}
          />
        </div>
      </CWDrawer>
    </div>
  );
};

export default FundContestDrawer;
