import React from 'react';

import { CWModalHeader } from '../../components/component_kit/new_designs/CWModal';
import { WalletFundsContent } from './WalletFundsContent';

import './WalletFundsModal.scss';

interface WalletFundsModalProps {
  onClose: () => void;
  chainId: number;
}

const WalletFundsModal = ({ onClose, chainId }: WalletFundsModalProps) => {
  return (
    <div className="WalletFundsModal">
      <CWModalHeader label="Manage Common Wallet" onModalClose={onClose} />
      <WalletFundsContent chainId={chainId} />
    </div>
  );
};

export { WalletFundsModal };
