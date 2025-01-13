import React from 'react';

import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import './ManageOnchainModal.scss';

type ManageOnchainModalProps = {
  onClose: () => void;
};

export const ManageOnchainModal = ({ onClose }: ManageOnchainModalProps) => {
  return (
    <div className="ManageOnchainModal">
      <CWModalHeader
        label="Manage onchain privileges"
        subheader="This action cannot be undone."
        onModalClose={onClose}
      />
      <CWModalBody>
        <></>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Confirm"
          buttonType="secondary"
          onClick={onClose}
          buttonHeight="sm"
        />
      </CWModalFooter>
    </div>
  );
};
