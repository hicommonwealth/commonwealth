import { Warning, WarningOctagon, X } from '@phosphor-icons/react';
import React, { FC } from 'react';

import { CWText } from '../../../cw_text';

import './CWModalHeader.scss';

type HeaderIconType = 'warning' | 'danger';

type CWModalHeaderProps = {
  label?: string | React.ReactNode;
  subheader?: string;
  icon?: HeaderIconType;
  onModalClose: () => void;
};

const CWModalHeader: FC<CWModalHeaderProps> = ({
  label = '',
  subheader = '',
  icon,
  onModalClose,
}) => {
  return (
    <div className="CWModalHeader">
      <div className="ModalHeader">
        {icon === 'warning' && (
          <Warning className="warning-icon" weight="fill" size={24} />
        )}
        {icon === 'danger' && (
          <WarningOctagon className="danger-icon" weight="fill" size={24} />
        )}
        <div className="Frame">
          <CWText className="title-text" type="h4">
            {label}
          </CWText>
          {subheader ? (
            <CWText className="Subtitle" type="caption" fontWeight="regular">
              {subheader}
            </CWText>
          ) : null}
        </div>
        <X className="close-icon" onClick={onModalClose} size={24} />
      </div>
    </div>
  );
};

export default CWModalHeader;
