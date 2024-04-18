import React, { useState } from 'react';

import app from 'state';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';

import FundContestForm from './FundContestForm';

import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import './FundContestDrawer.scss';

interface FundContestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contestAddress: string;
}

const fakeApiCall = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const randomNum = Math.random();
      if (randomNum < 0.5) {
        resolve('API call successful');
      } else {
        reject(new Error('API call failed'));
      }
    }, 2000);
  });
};

export type FundContestStep = 'Form' | 'Loading' | 'Success' | 'Failure';

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

  const [fundContestDrawerStep, setFundContestDrawerStep] =
    useState<FundContestStep>('Form');
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

  // write fake api call that uses math random and sometimes throws an error and sometimes succeeds

  const handleTransferFunds = async () => {
    try {
      setFundContestDrawerStep('Loading');
      await fakeApiCall();
      setFundContestDrawerStep('Success');
    } catch (err) {
      setFundContestDrawerStep('Failure');
    }
  };

  const getCurrentStep = () => {
    switch (fundContestDrawerStep) {
      case 'Form':
        return (
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
        );

      case 'Loading':
        return (
          <div>
            <CWCircleMultiplySpinner />
          </div>
        );

      case 'Failure':
        return (
          <div>
            <CWButton
              label="Try again"
              onClick={() => setFundContestDrawerStep('Form')}
            />
          </div>
        );

      case 'Success':
        return (
          <div>
            <CWButton label="Close" onClick={onClose} buttonType="secondary" />
            <CWButton
              label="View transactions"
              onClick={() => window.open('https://etherscan.io', '_blank')}
            />
          </div>
        );
    }
  };

  return (
    <div className="FundContestDrawer">
      <CWDrawer open={isOpen} onClose={onClose}>
        <CWDrawerTopBar onClose={onClose} />
        <div className="fund-contest-drawer-container">{getCurrentStep()}</div>
      </CWDrawer>
    </div>
  );
};

export default FundContestDrawer;
