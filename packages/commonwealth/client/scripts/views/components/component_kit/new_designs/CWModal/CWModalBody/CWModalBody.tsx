import React, { FC } from 'react';

import { getClasses } from '../../../helpers';

import './CWModalBody.scss';

interface CWModalBodyProps {
  children: React.ReactNode;
  className?: string;
  allowOverflow?: boolean;
}

const CWModalBody: FC<CWModalBodyProps> = ({
  children,
  className,
  allowOverflow,
}) => {
  return (
    <div className={getClasses({ className, allowOverflow }, 'CWModalBody')}>
      {children}
    </div>
  );
};

export default CWModalBody;
