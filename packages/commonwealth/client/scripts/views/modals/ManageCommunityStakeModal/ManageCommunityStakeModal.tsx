import React, { useState } from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWModalHeader } from 'views/components/component_kit/new_designs/CWModal';

import StakeExchangeForm from './StakeExchangeForm';
import TransactionFailed from './TransactionFailed';
import TransactionLoading from './TransactionLoading';
import TransactionSucceeded from './TransactionSucceeded';
import { useStakeAddresses } from './hooks';
import {
  ManageCommunityStakeModalProps,
  ManageCommunityStakeModalState,
} from './types';

import './ManageCommunityStakeModal.scss';

const ManageCommunityStakeModal = ({
  onModalClose,
  mode,
  denomination,
  community,
}: ManageCommunityStakeModalProps) => {
  const [modalState, setModalState] = useState(
    ManageCommunityStakeModalState.Exchange,
  );
  const [successTransactionHash, setSuccessTransactionHash] = useState('');
  const [numberOfStakeToExchange, setNumberOfStakeToExchange] = useState(1);

  const { selectedAddress, setSelectedAddress, addressOptions } =
    useStakeAddresses({ community });

  const getModalBody = () => {
    switch (modalState) {
      case ManageCommunityStakeModalState.Exchange:
        return (
          <StakeExchangeForm
            mode={mode}
            onSetModalState={setModalState}
            onSetSuccessTransactionHash={setSuccessTransactionHash}
            selectedAddress={selectedAddress}
            onSetSelectedAddress={setSelectedAddress}
            addressOptions={addressOptions}
            numberOfStakeToExchange={numberOfStakeToExchange}
            onSetNumberOfStakeToExchange={setNumberOfStakeToExchange}
            denomination={denomination}
            community={community}
          />
        );
      case ManageCommunityStakeModalState.Loading:
        return <TransactionLoading />;
      case ManageCommunityStakeModalState.Failure:
        return (
          <TransactionFailed
            onModalClose={onModalClose}
            setModalState={setModalState}
          />
        );
      case ManageCommunityStakeModalState.Success:
        return (
          <TransactionSucceeded
            onModalClose={onModalClose}
            mode={mode}
            successTransactionHash={successTransactionHash}
          />
        );
    }
  };

  const getModalHeader = () => {
    if (modalState === ManageCommunityStakeModalState.Failure) {
      return (
        <>
          <CWIcon iconName="warning" weight="fill" className="warning-icon" />{' '}
          Transaction failed!
        </>
      );
    }

    if (mode === 'buy') {
      return 'Buy stake';
    }

    if (mode === 'sell') {
      return 'Sell stake';
    }
  };

  return (
    <div className="ManageCommunityStakeModal">
      <CWModalHeader label={getModalHeader()} onModalClose={onModalClose} />
      {getModalBody()}
    </div>
  );
};

export default ManageCommunityStakeModal;
