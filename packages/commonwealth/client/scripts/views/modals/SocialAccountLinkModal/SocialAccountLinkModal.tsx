import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import './SocialAccountLinkModal.scss';

type SocialAccountLinkModalProps = {
  onModalClose: () => void;
  isModalOpen?: boolean;
  formattedLink: string;
};

export const SocialAccountLinkModal = ({
  onModalClose,
  formattedLink,
}: SocialAccountLinkModalProps) => {
  return (
    <div className="SocialAccountLinkModal">
      <CWModalHeader
        label="You're leaving Common"
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <CWText className="link-text">{formattedLink}</CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          buttonHeight="sm"
          onClick={onModalClose}
          label="Cancel"
          buttonType="secondary"
        />
        <CWButton
          buttonHeight="sm"
          onClick={() => {
            window.open(formattedLink, '_blank', 'noopener,noreferrer');
            onModalClose();
          }}
          label="Continue"
          buttonType="primary"
        />
      </CWModalFooter>
    </div>
  );
};
