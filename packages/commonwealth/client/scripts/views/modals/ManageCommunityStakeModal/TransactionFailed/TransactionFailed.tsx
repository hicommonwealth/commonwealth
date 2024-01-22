import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import { ManageCommunityStakeModalState } from '../types';

import './TransactionFailed.scss';

interface TransactionFailedProps {
  onModalClose: () => void;
  setModalState: (modalState: ManageCommunityStakeModalState) => void;
}

const TransactionFailed = ({
  onModalClose,
  setModalState,
}: TransactionFailedProps) => {
  return (
    <div className="TransactionFailed">
      <CWModalBody>
        <CWText type="b2">Seems something went wrong. Please try again.</CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          buttonHeight="sm"
          label="Close"
          buttonType="secondary"
          onClick={onModalClose}
        />
        <CWButton
          buttonHeight="sm"
          label="Try again"
          buttonType="primary"
          onClick={() => setModalState(ManageCommunityStakeModalState.Exchange)}
        />
      </CWModalFooter>
    </div>
  );
};

export default TransactionFailed;
