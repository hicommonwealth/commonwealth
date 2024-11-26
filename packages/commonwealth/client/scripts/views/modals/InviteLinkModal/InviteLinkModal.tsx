import React from 'react';

import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';

import './InviteLinkModal.scss';

interface InviteLinkModalProps {
  isOpen: boolean;
  onModalClose: () => void;
}

const InviteLinkModal = ({ isOpen, onModalClose }: InviteLinkModalProps) => {
  return (
    <div className="InviteLinkModal">
      <CWModalHeader label="Invite Link" onModalClose={onModalClose} />
      <CWModalBody>
        <div className="InviteLinkModal__content">
          <CWText type="h3">Get your invite link</CWText>
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton label="Close" onClick={onModalClose} />
      </CWModalFooter>
    </div>
  );
};

export default InviteLinkModal;
