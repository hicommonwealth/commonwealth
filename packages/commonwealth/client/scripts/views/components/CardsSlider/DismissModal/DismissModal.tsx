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
  label: string;
  description: string;
  showDismissCheckbox?: boolean;
}

const DismissModal = ({
  onModalClose,
  onDismiss,
  label,
  description,
  showDismissCheckbox,
}: DismissModalProps) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="DismissModal">
      <CWModalHeader label={label} onModalClose={onModalClose} />
      <CWModalBody>
        <CWText type="b1" className="description">
          {description}
        </CWText>
        {showDismissCheckbox && (
          <CWCheckbox
            checked={isChecked}
            label="Don't show this again"
            onChange={() => setIsChecked((prevChecked) => !prevChecked)}
          />
        )}
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
