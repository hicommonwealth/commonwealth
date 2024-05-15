import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import './DismissModal.scss';

interface DismissModalProps {
  onModalClose: () => void;
  onDismiss: () => void;
}

const DismissModal = ({ onModalClose, onDismiss }: DismissModalProps) => {
  return (
    <div className="DismissModal">
      <CWModalHeader label="Dismiss item" onModalClose={onModalClose} />
      <CWModalBody>
        <CWText type="b1" className="description">
          Are you sure you&apos;d like to dismiss?
        </CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          onClick={onModalClose}
        />
        <CWButton
          label="Dismiss"
          buttonWidth="wide"
          onClick={() => onDismiss()}
        />
      </CWModalFooter>
    </div>
  );
};

export default DismissModal;
