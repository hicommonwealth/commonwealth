import clsx from 'clsx';
import React from 'react';
import './CWTabsRow.scss';

interface CWTabsRowProps {
  children: React.ReactNode;
  boxed?: boolean;
  className?: string;
}
const CWTabsRow = ({ children, className, boxed = false }: CWTabsRowProps) => {
  return (
    <div className={clsx('CWTabsRow', className, { boxed: boxed })}>
      {children}
    </div>
  );
};

export default CWTabsRow;
