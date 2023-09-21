import { Modal } from 'views/components/component_kit/cw_modal';
import React from 'react';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal/SessionRevalidationModal';
import { SessionKeyError } from 'controllers/server/sessions';

const useSessionRevalidationModal = ({ handleClose, error }) => {
  const sessionKeyValidationError = error instanceof SessionKeyError && error;

  const RevalidationModal = (
    <Modal
      isFullScreen={false}
      content={
        <SessionRevalidationModal
          onModalClose={handleClose}
          walletSsoSource={sessionKeyValidationError.ssoSource}
          walletAddress={sessionKeyValidationError.address}
        />
      }
      onClose={handleClose}
      open={!!sessionKeyValidationError}
    />
  );

  return { RevalidationModal };
};

export default useSessionRevalidationModal;
