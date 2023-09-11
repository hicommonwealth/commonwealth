import React, { FC } from 'react';

import { getClasses } from '../../../helpers';

import './CWModalBody.scss';

interface CWModalBodyProps {
  children: React.ReactNode;
  className?: string;
  unset?: boolean;
}

const CWModalBody: FC<CWModalBodyProps> = ({ children, className, unset }) => {
  return (
    <div className={getClasses({ className, unset }, 'CWModalBody')}>
      {children}
    </div>
  );
};

export default CWModalBody;
