import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import app from 'state';
import { CWModalHeader } from '../../modals/CWModalHeader';

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
      <CWModalHeader
        label="Terms of Service"
        icon="warning"
        onModalClose={onModalClose}
      />
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
