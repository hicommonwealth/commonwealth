import React, { FC } from 'react';

import { getClasses } from '../../../helpers';

import './CWModalBody.scss';

interface CWModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

const CWModalBody: FC<CWModalBodyProps> = ({ children, className }) => {
  return (
    <div
      className={getClasses<{ className?: string }>(
        { className },
        'CWModalBody'
      )}
    >
      {children}
    </div>
  );
};

export default CWModalBody;
