import React, { FC } from 'react';

import { getClasses } from '../../../helpers';

import './CWModalFooter.scss';

interface CWModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CWModalFooter: FC<CWModalFooterProps> = ({ children, className }) => {
  return (
    <div
      className={getClasses<{ className?: string }>(
        { className },
        'CWModalFooter'
      )}
    >
      {children}
    </div>
  );
};

export default CWModalFooter;
