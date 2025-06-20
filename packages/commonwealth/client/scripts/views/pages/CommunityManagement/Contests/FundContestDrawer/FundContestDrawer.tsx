import React, { useState } from 'react';

import { ChainBase } from '@hicommonwealth/shared';
import app from 'state';
import { useFundContestOnchainMutation } from 'state/api/contests';
import useFundSolanaContestOnchainMutation from 'state/api/contests/fundSolanaContestOnchain';
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
  isRecurring?: boolean;
}

export type FundContestStep = 'Form' | 'Loading' | 'Success' | 'Failure';

const FundContestDrawer = ({
  isOpen,
  onClose,
  contestAddress,
  fundingTokenAddress,
  fundingTokenTicker,
  isRecurring = false,
}: FundContestDrawerProps) => {
  const [fundContestDrawerStep, setFundContestDrawerStep] =
    useState<FundContestStep>('Form');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const chainRpc = app?.chain?.meta?.ChainNode?.url || '';
  const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;
  const isSolanaChain = app?.chain?.meta?.base === ChainBase.Solana;

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
    ethChainId,
    userAddress: selectedAddress.value,
    isRecurring,
  });

  const { mutateAsync: fundEvmContest } = useFundContestOnchainMutation();
  const { mutateAsync: fundSolanaContest } =
    useFundSolanaContestOnchainMutation();

  const handleChangeTokenAmount = (e) => {
    setTokenAmount(e.target.value);
  };

  const handleTransferFunds = () => {
    setFundContestDrawerStep('Loading');
    setErrorMessage('');

    if (isSolanaChain) {
      // Check for Phantom wallet in window object

      fundSolanaContest({
        contestAddress,
        chainRpc,
        amount: Number(tokenAmount),
      })
        .then((tx) => {
          setFundContestDrawerStep('Success');
          setTxHash(tx.transactionHash);
        })
        .catch((err) => {
          console.error('Failed to fund Solana contest', err);
          setErrorMessage(
            err.message || 'Failed to fund Solana contest. Please try again.',
          );
          setFundContestDrawerStep('Failure');
        });
    } else {
      // EVM chain funding
      fundEvmContest({
        contestAddress,
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
          console.error('Failed to fund contest', err);
          setErrorMessage(
            err.message || 'Failed to fund contest. Please try again.',
          );
          setFundContestDrawerStep('Failure');
        });
    }
  };

  const handleClose = () => {
    onClose();
    setFundContestDrawerStep('Form');
    setTokenAmount(INITIAL_AMOUNT);
    setTxHash('');
    setErrorMessage('');
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
            isSolanaChain={isSolanaChain}
          />
        );

      case 'Loading':
        return <FundContestLoading />;

      case 'Failure':
        return (
          <FundContestFailure
            onSetFundContestDrawerStep={setFundContestDrawerStep}
            errorMessage={errorMessage}
          />
        );

      case 'Success':
        return (
          <FundContestSuccess
            onClose={handleClose}
            address={contestAddress}
            txHash={txHash}
            isSolanaChain={isSolanaChain}
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
