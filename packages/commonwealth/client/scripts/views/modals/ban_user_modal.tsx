import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React from 'react';
import app from 'state';
import { useBanProfileByAddressMutation } from 'state/api/profiles';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type BanUserModalAttrs = {
  onModalClose: () => void;
  address: string;
};

export const BanUserModal = ({ address, onModalClose }: BanUserModalAttrs) => {
  const { mutateAsync: banUser } = useBanProfileByAddressMutation({
    chainId: app.activeChainId(),
    address: address,
  });

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
      notifyError('Ban Address Failed');
    }
  };

  return (
    <React.Fragment>
      <div className="compact-modal-title ban-user">
        <h3>Are You Sure?</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <div>
          Banning an address prevents it from interacting with the forum.
        </div>
        <div className="ban-modal-content">
          <CWButton
            label="Ban Address (just click once and wait)"
            buttonType="primary-red"
            onClick={onBanConfirmation}
          />
        </div>
      </div>
    </React.Fragment>
  );
};
