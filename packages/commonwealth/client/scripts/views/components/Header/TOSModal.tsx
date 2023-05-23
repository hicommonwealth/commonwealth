import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import React from 'react';

import 'components/Header/TOSModal.scss';

type TOSModalProps = {
  onAccept: () => void;
  onModalClose: () => void;
};

export const TOSModal = ({ onModalClose, onAccept }: TOSModalProps) => {
  return (
    <div className="TOSModal">
      <div className="close-button-wrapper">
        <CWIconButton
          iconButtonTheme="primary"
          iconName="close"
          iconSize="small"
          className="close-icon"
          onClick={onModalClose}
        />
      </div>
      <div className="content-wrapper">
        <CWText>
          By clicking accept you agree to the community's Terms of Service
        </CWText>
        <CWButton onClick={onAccept} label="Accept" />
      </div>
    </div>
  );
};
