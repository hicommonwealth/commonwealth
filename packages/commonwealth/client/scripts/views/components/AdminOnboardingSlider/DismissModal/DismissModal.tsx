import React, { useState } from 'react';

import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import './DismissModal.scss';

interface DismissModalProps {
  onModalClose: () => any;
  onDismiss: (shouldDismissPermanently: boolean) => any;
}

const DismissModal = ({ onModalClose, onDismiss }: DismissModalProps) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="DismissModal">
      <CWModalHeader
        label="Setting up your community"
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <CWText type="b1" className="description">
          You can access all of these features from the admin capabilities
          section of the side panel in your community. We will remind you to
          complete these tasks next time you log in unless you select
          &quot;Don&apos;t show this again.&quot;
        </CWText>
        <CWCheckbox
          checked={isChecked}
          label="Don't show this again"
          onChange={() => setIsChecked((prevChecked) => !prevChecked)}
        />
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
          onClick={() => onDismiss(isChecked)}
        />
      </CWModalFooter>
    </div>
  );
};

export default DismissModal;
