import React from 'react';

import { useBanProfileByAddressMutation } from 'state/api/profiles';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  notifyError,
  notifySuccess,
} from '../../controllers/app/notifications';
import app from '../../state';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { CWButton } from '../components/component_kit/new_designs/cw_button';

type BanUserModalAttrs = {
  onModalClose: () => void;
  address: string;
};

export const BanUserModal = ({ address, onModalClose }: BanUserModalAttrs) => {
  const { mutateAsync: banUser } = useBanProfileByAddressMutation({
    chainId: app.activeChainId(),
    address: address,
  });

  const handleModalClose = (e) => {
    e.stopPropagation();
    onModalClose();
  };

  const onBanConfirmation = async () => {
    // ZAK TODO: Update Banned User Table with userProfile
    if (!address) {
      notifyError('CW Data error');
      return;
    }

    try {
      await banUser({
        address,
        chainId: app.activeChainId(),
      });
      onModalClose();
      notifySuccess('Banned Address');
    } catch (e) {
      notifyError(e.response.data.error);
    }
  };

  return (
    <div className="BanUserModal">
      <CWModalHeader
        label="Are You Sure?"
        icon="danger"
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <CWText>
          Banning an address prevents it from interacting with the forum. This
          may take a few moments. Please click once and wait.
        </CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={handleModalClose}
        />
        <CWButton
          label="Ban Address"
          buttonType="destructive"
          buttonHeight="sm"
          onClick={onBanConfirmation}
        />
      </CWModalFooter>
    </div>
  );
};
