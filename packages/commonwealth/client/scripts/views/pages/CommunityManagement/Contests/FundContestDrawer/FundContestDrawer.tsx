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
  fundingTokenAddress?: string;
  fundingTokenTicker: string;
}

export type FundContestStep = 'Form' | 'Loading' | 'Success' | 'Failure';

const FundContestDrawer = ({
  isOpen,
  onClose,
  contestAddress,
  fundingTokenAddress,
  fundingTokenTicker,
}: FundContestDrawerProps) => {
  const [fundContestDrawerStep, setFundContestDrawerStep] =
    useState<FundContestStep>('Form');
  const [txHash, setTxHash] = useState('');

  const chainRpc = app?.chain?.meta?.ChainNode?.url || '';
  const chainNodeId = app?.chain?.meta?.ChainNode?.id || 0;
  const ethChainId = app?.chain?.meta?.ChainNode?.ethChainId;

  const { addressOptions, selectedAddress, setSelectedAddress } =
    useUserAddressesForFundForm();

  const {
    tokenAmount,
    tokenAmountInUsd,
    setTokenAmount,
    amountError,
    contestTokenBalance,
    newContestBalanceInUsd,
    newContestTokenBalance,
    userTokenBalance,
  } = useFundContestForm({
    fundingTokenAddress,
    contestAddress,
    chainRpc,
    // @ts-expect-error <StrictNullChecks/>
    ethChainId,
    chainNodeId,
    userAddress: selectedAddress.value,
  });

  const { mutateAsync: fundContest } = useFundContestOnchainMutation();

  const handleChangeTokenAmount = (e) => {
    setTokenAmount(e.target.value);
  };

  const handleTransferFunds = () => {
    setFundContestDrawerStep('Loading');

    fundContest({
      contestAddress,
      // @ts-expect-error <StrictNullChecks/>
      ethChainId,
      chainRpc,
      amount: Number(tokenAmount),
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
    setTokenAmount(INITIAL_AMOUNT);
    setTxHash('');
  };

  const getCurrentStep = () => {
    switch (fundContestDrawerStep) {
      case 'Form':
        return (
          <FundContestForm
            onClose={handleClose}
            handleTransferFunds={handleTransferFunds}
            tokenAmount={tokenAmount}
            // @ts-expect-error <StrictNullChecks/>
            amountError={amountError}
            handleChangeTokenAmount={handleChangeTokenAmount}
            selectedAddress={selectedAddress}
            onSetSelectedAddress={setSelectedAddress}
            addressOptions={addressOptions}
            // @ts-expect-error <StrictNullChecks/>
            userTokenBalance={userTokenBalance}
            contestTokenBalance={contestTokenBalance}
            tokenAmountInUsd={tokenAmountInUsd}
            newContestTokenBalance={newContestTokenBalance}
            newContestBalanceInUsd={newContestBalanceInUsd}
            contestAddress={contestAddress}
            fundingTokenTicker={fundingTokenTicker}
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
