import React from 'react';

import SelectWalletContent from './SelectWalletContent';

import AddressInfo from 'models/AddressInfo';
import './NewCommunityAdminModal.scss';

interface NewCommunityAdminModalProps {
  onModalClose: () => void;
  availableAddresses: AddressInfo[];
  handleClickConnectNewWallet: () => void;
  handleClickContinue: (selectedAddress: string) => void;
}

const NewCommunityAdminModal = ({
  onModalClose,
  availableAddresses,
  handleClickConnectNewWallet,
  handleClickContinue,
}: NewCommunityAdminModalProps) => {
  return (
    <div className="NewCommunityAdminModal">
      <SelectWalletContent
        onModalClose={onModalClose}
        availableAddresses={availableAddresses}
        handleClickConnectNewWallet={handleClickConnectNewWallet}
        handleClickContinue={handleClickContinue}
      />
    </div>
  );
};

export default NewCommunityAdminModal;
