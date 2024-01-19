import React, { useState } from 'react';

import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import StakeExchangeForm from './StakeExchangeForm';

import './ManageCommunityStakeModal.scss';

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

export type ManageCommunityStakeModalMode = 'buy' | 'sell';

interface ManageCommunityStakeModalProps {
  onModalClose: () => void;
  mode: ManageCommunityStakeModalMode;
}

const TransactionLoading = () => {
  return (
    <>
      <CWModalBody>
        <div>loading</div>
        <CWSpinner />
      </CWModalBody>
    </>
  );
};
interface TransactionFailedProps {
  onModalClose: () => void;
  setModalState: (modalState: ManageCommunityStakeModalState) => void;
}
const TransactionFailed = ({
  onModalClose,
  setModalState,
}: TransactionFailedProps) => {
  return (
    <>
      <CWModalBody>⚠️ TransactionFailed</CWModalBody>
      <CWModalFooter>
        <CWButton label="Close" buttonType="secondary" onClick={onModalClose} />
        <CWButton
          label="Try again"
          buttonType="primary"
          onClick={() => setModalState(ManageCommunityStakeModalState.Exchange)}
        />
      </CWModalFooter>
    </>
  );
};

interface TransactionSucceededProps {
  onModalClose: () => void;
}
const TransactionSucceeded = ({ onModalClose }: TransactionSucceededProps) => {
  return (
    <>
      <CWModalBody>🚀 TransactionSucceeded</CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Close"
          buttonType="primary"
          buttonWidth="full"
          onClick={onModalClose}
        />
      </CWModalFooter>
    </>
  );
};

export enum ManageCommunityStakeModalState {
  Exchange = 'Exchange',
  Loading = 'Loading',
  Failure = 'Failure',
  Success = 'Success',
}

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
        return <TransactionSucceeded onModalClose={onModalClose} />;
    }
  };

  const getModalHeader = () => {
    if (modalState === ManageCommunityStakeModalState.Failure) {
      return 'Transaction failed';
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
