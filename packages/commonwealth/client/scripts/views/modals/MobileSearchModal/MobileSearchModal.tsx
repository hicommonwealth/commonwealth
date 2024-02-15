import React from 'react';

import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';

import './MobileSearchModal.scss';

interface MobileSearchModalProps {
  onModalClose: () => void;
}

const MobileSearchModal = ({ onModalClose }: MobileSearchModalProps) => {
  return (
    <div className="MobileSearchModal">
      <div className="header">
        <CWSearchBar size="small" />

        <CWButton
          onClick={onModalClose}
          buttonHeight="sm"
          label="Cancel"
          buttonType="secondary"
        />
      </div>
    </div>
  );
};

export default MobileSearchModal;
