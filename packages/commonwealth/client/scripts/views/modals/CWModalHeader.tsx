import React, { FC } from 'react';
import { X } from '@phosphor-icons/react';

import { CWText } from '../components/component_kit/cw_text';

import 'modals/CWModalHeader.scss';

type CWModalHeaderProps = {
  label: string;
  onModalClose: () => void;
};

export const CWModalHeader: FC<CWModalHeaderProps> = ({
  label,
  onModalClose,
}) => {
  return (
    <div className="compact-modal-title">
      <CWText className="title-text" type="h4">
        {label}
      </CWText>
      <X className="close-icon" onClick={() => onModalClose()} size={24} />
    </div>
  );
};
