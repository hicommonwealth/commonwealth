import React, { FC } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';

import './DeletePollModal.scss';

type DeletePollModalProps = {
  onDelete: any;
  onClose: () => void;
};

export const DeletePollModal: FC<DeletePollModalProps> = ({
  onDelete,
  onClose,
}) => {
  const handleDeleteClick = async (e) => {
    e.preventDefault();
    await onDelete();
    // Assuming you are using a library like 'react-modal', you can trigger the modal exit using that library's methods.
  };

  return (
    <div className="DeletePollModal">
      <CWModalHeader
        label="Delete this poll?"
        icon="danger"
        onModalClose={onClose}
      />
      <CWModalBody>
        <CWText>This action cannot be reversed.</CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onClose}
        />
        <CWButton
          buttonType="destructive"
          buttonHeight="sm"
          label="Confirm"
          onClick={handleDeleteClick}
        />
      </CWModalFooter>
    </div>
  );
};
