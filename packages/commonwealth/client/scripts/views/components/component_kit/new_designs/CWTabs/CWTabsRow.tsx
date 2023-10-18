import React from 'react';

import './CWTabsRow.scss';

interface CWTabsRowProps {
  children: React.ReactNode;
}
const CWTabsRow = ({ children }: CWTabsRowProps) => {
  return <div className="CWTabsRow">{children}</div>;
};

export default CWTabsRow;
