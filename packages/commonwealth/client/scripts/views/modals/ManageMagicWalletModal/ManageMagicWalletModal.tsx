import React from 'react';

import { CWModalHeader } from '../../components/component_kit/new_designs/CWModal';
import { ManageMagicWalletContent } from './ManageMagicWalletContent';

import './ManageMagicWalletModal.scss';

interface ManageMagicWalletModalProps {
  onClose: () => void;
  chainId: number;
}

const ManageMagicWalletModal = ({
  onClose,
  chainId,
}: ManageMagicWalletModalProps) => {
  return (
    <div className="ManageMagicWalletModal">
      <CWModalHeader label="Manage Common Wallet" onModalClose={onClose} />
      <ManageMagicWalletContent chainId={chainId} />
    </div>
  );
};

export { ManageMagicWalletModal };
