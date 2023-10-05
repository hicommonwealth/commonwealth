import React from 'react';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal/SessionRevalidationModal';
import { SessionKeyError } from 'controllers/server/sessions';

const useSessionRevalidationModal = ({ handleClose, error }) => {
  const sessionKeyValidationError = error instanceof SessionKeyError && error;

  const RevalidationModal = (
    <CWModal
      size="medium"
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
