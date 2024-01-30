import clsx from 'clsx';
import React from 'react';

import './CWTabsRow.scss';

interface CWTabsRowProps {
  children: React.ReactNode;
  boxed?: boolean;
}
const CWTabsRow = ({ children, boxed = false }: CWTabsRowProps) => {
  return <div className={clsx('CWTabsRow', { boxed: boxed })}>{children}</div>;
};

export default CWTabsRow;
