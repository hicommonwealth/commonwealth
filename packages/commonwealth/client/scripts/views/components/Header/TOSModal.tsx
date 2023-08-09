import React from 'react';
import { Warning, X } from '@phosphor-icons/react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import app from 'state';

import 'components/Header/TOSModal.scss';

type TOSModalProps = {
  onAccept: () => void;
  onModalClose: () => void;
};

export const TOSModal = ({ onModalClose, onAccept }: TOSModalProps) => {
  const chain = app.chain ? app.chain.meta : null;
  const terms = app.chain ? chain.terms : null;

  return (
    <div className="TOSModal">
      <div className="compact-modal-title">
        <div className="Frame">
          <Warning className="warning-icon" weight="fill" size={24} />
          <CWText type="h4">Terms of Service</CWText>
        </div>
        <X className="close-icon" onClick={() => onModalClose()} size={24} />
      </div>
      <div className="content-wrapper">
        <CWText>
          By clicking accept you agree to the community's
          <a href={terms} target="_blank">
            Terms of Service
          </a>
          .
        </CWText>
      </div>
      <div className="compact-modal-footer">
        <CWButton
          buttonType="primary"
          buttonHeight="sm"
          onClick={onAccept}
          label="Accept"
        />
      </div>
    </div>
  );
};
