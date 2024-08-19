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
  onDelete: () => void;
  onClose: () => void;
};

export const DeletePollModal: FC<DeletePollModalProps> = ({
  onDelete,
  onClose,
}) => {
  const handleDeleteClick = (e) => {
    e.preventDefault();
    onDelete();
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
