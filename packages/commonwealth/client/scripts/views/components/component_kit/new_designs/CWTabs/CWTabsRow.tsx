import React from 'react';

import clsx from 'clsx';
import './CWTabsRow.scss';

interface CWTabsRowProps {
  children: React.ReactNode;
  className?: string;
}

const CWTabsRow = ({ children, className }: CWTabsRowProps) => {
  return <div className={clsx('CWTabsRow', className)}>{children}</div>;
};

export default CWTabsRow;
