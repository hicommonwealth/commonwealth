import React, { useState } from 'react';

import app from 'state';
import { useFundContestOnchainMutation } from 'state/api/contests';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';

import {
  FundContestFailure,
  FundContestForm,
  FundContestLoading,
  FundContestSuccess,
} from './steps';
import useFundContestForm, { INITIAL_AMOUNT } from './useFundContestForm';
import useUserAddressesForFundForm from './useUserAddressesForFundForm';

import './FundContestDrawer.scss';

interface FundContestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contestAddress: string;
}

export type FundContestStep = 'Form' | 'Loading' | 'Success' | 'Failure';

const FundContestDrawer = ({
  isOpen,
  onClose,
  contestAddress,
}: FundContestDrawerProps) => {
  const [fundContestDrawerStep, setFundContestDrawerStep] =
    useState<FundContestStep>('Form');
  const [txHash, setTxHash] = useState('');

  const chainRpc = app?.chain?.meta?.ChainNode?.url;
  const ethChainId = app?.chain?.meta?.ChainNode?.ethChainId;

  const { addressOptions, selectedAddress, setSelectedAddress } =
    useUserAddressesForFundForm();

  const {
    amountEth,
    amountEthInUsd,
    setAmountEth,
    amountError,
    contestEthBalance,
    newContestBalanceInUsd,
    newContestBalanceInEth,
    userEthBalance,
  } = useFundContestForm({
    contestAddress,
    chainRpc,
    ethChainId,
    userAddress: selectedAddress.value,
  });

  const { mutateAsync: fundContest } = useFundContestOnchainMutation();

  const handleChangeEthAmount = (e) => {
    setAmountEth(e.target.value);
  };

  const handleTransferFunds = () => {
    setFundContestDrawerStep('Loading');

    fundContest({
      contestAddress,
      ethChainId,
      chainRpc,
      amount: Number(amountEth),
      walletAddress: selectedAddress.value,
    })
      .then((tx) => {
        setFundContestDrawerStep('Success');
        setTxHash(tx.transactionHash as string);
      })
      .catch((err) => {
        console.log('Failed to fund contest', err);
        setFundContestDrawerStep('Failure');
      });
  };

  const handleClose = () => {
    onClose();
    setFundContestDrawerStep('Form');
    setAmountEth(INITIAL_AMOUNT);
    setTxHash('');
  };

  const getCurrentStep = () => {
    switch (fundContestDrawerStep) {
      case 'Form':
        return (
          <FundContestForm
            onClose={handleClose}
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
            contestAddress={contestAddress}
          />
        );

      case 'Loading':
        return <FundContestLoading />;

      case 'Failure':
        return (
          <FundContestFailure
            onSetFundContestDrawerStep={setFundContestDrawerStep}
          />
        );

      case 'Success':
        return (
          <FundContestSuccess
            onClose={handleClose}
            address={contestAddress}
            txHash={txHash}
          />
        );
    }
  };

  return (
    <div className="FundContestDrawer">
      <CWDrawer open={isOpen} onClose={handleClose}>
        <CWDrawerTopBar onClose={handleClose} />
        <div className="fund-contest-drawer-container">{getCurrentStep()}</div>
      </CWDrawer>
    </div>
  );
};

export default FundContestDrawer;
