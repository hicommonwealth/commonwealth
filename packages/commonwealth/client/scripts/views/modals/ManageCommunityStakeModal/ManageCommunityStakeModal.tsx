import React, { useState } from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWModalHeader } from 'views/components/component_kit/new_designs/CWModal';

import StakeExchangeForm from './StakeExchangeForm';
import TransactionFailed from './TransactionFailed';
import TransactionLoading from './TransactionLoading';
import TransactionSucceeded from './TransactionSucceeded';
import {
  ManageCommunityStakeModalProps,
  ManageCommunityStakeModalState,
} from './types';

import './ManageCommunityStakeModal.scss';

// TODO only for testing purpose, remove when backend will be hooked up
export const fakeRandomAPICall = () => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.5) {
        resolve();
      } else {
        reject();
      }
    }, 1000);
  });
};

const ManageCommunityStakeModal = ({
  onModalClose,
  mode,
}: ManageCommunityStakeModalProps) => {
  const [modalState, setModalState] = useState(
    ManageCommunityStakeModalState.Exchange,
  );

  const getModalBody = () => {
    switch (modalState) {
      case ManageCommunityStakeModalState.Exchange:
        return <StakeExchangeForm mode={mode} setModalState={setModalState} />;
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
        return <TransactionSucceeded onModalClose={onModalClose} mode={mode} />;
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
