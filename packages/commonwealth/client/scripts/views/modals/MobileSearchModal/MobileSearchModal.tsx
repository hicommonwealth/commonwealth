import React from 'react';

import { CWButton } from 'views/components/component_kit/CWButton';
import { CWSearchBar } from 'views/components/component_kit/CWSearchBar';

import './MobileSearchModal.scss';

interface MobileSearchModalProps {
  onModalClose: () => void;
}

const MobileSearchModal = ({ onModalClose }: MobileSearchModalProps) => {
  return (
    <div className="MobileSearchModal">
      <div className="header">
        <CWSearchBar size="small" onSearchItemClick={onModalClose} />

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
