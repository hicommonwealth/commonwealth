import React from 'react';

import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import './TOSModal.scss';

type TOSModalProps = {
  onAccept: () => void;
  onModalClose: () => void;
};

const TOSModal = ({ onModalClose, onAccept }: TOSModalProps) => {
  const terms = app.chain?.meta?.terms;

  return (
    <div className="TOSModal">
      <CWModalHeader
        label="Terms of Service"
        icon="warning"
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <CWText className="body">
          By clicking accept you agree to the community&apos;s
          <a href={terms} target="_blank" rel="noreferrer">
            Terms of Service
          </a>
          .
        </CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onModalClose}
        />
        <CWButton
          buttonType="primary"
          buttonHeight="sm"
          onClick={onAccept}
          label="Accept"
        />
      </CWModalFooter>
    </div>
  );
};

export default TOSModal;
