import React from 'react';

import { CWModalHeader } from '../../components/component_kit/new_designs/CWModal';
import { WalletFundsContent } from './WalletFundsContent';

import './WalletFundsModal.scss';

interface WalletFundsModalProps {
  onClose: () => void;
}

const WalletFundsModal = ({ onClose }: WalletFundsModalProps) => {
  return (
    <div className="WalletFundsModal">
      <CWModalHeader
        label="Add funds to your Common wallet"
        onModalClose={onClose}
      />
      <WalletFundsContent />
    </div>
  );
};

export { WalletFundsModal };
