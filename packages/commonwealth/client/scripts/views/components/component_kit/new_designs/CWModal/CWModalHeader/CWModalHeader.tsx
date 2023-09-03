import React, { FC } from 'react';
import { Warning, WarningOctagon, X } from '@phosphor-icons/react';

import { CWText } from '../../../cw_text';

import './CWModalHeader.scss';

type WarningIcon = 'warning' | 'danger';

type CWModalHeaderProps = {
  label?: string;
  icon?: WarningIcon;
  onModalClose: () => void;
};

const CWModalHeader: FC<CWModalHeaderProps> = ({
  label = '',
  icon,
  onModalClose,
}) => {
  return (
    <div className="CWModalHeader">
      <div className="Frame">
        {icon === 'warning' && (
          <Warning className="warning-icon" weight="fill" size={24} />
        )}
        {icon === 'danger' && (
          <WarningOctagon className="danger-icon" weight="fill" size={24} />
        )}
        <CWText className="title-text" type="h4">
          {label}
        </CWText>
      </div>
      <X className="close-icon" onClick={() => onModalClose()} size={24} />
    </div>
  );
};

export default CWModalHeader;
