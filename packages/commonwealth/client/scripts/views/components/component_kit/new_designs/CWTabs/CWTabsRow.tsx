import React, { Children, isValidElement } from 'react';

import './CWTabsRow.scss';

interface CWTabsRowProps {
  children: React.ReactNode;
}
const CWTabsRow = ({ children }: CWTabsRowProps) => {
  const childrenArray = Children.toArray(children);

  // The only children of CWTabsRow can be CWTab
  const allChildrenValid = childrenArray.every((child) => {
    return (
      isValidElement(child) &&
      typeof child.type !== 'string' &&
      child.type?.name === 'CWTab'
    );
  });

  if (!allChildrenValid) {
    console.error('CWTabsRow component can only contain CWTab components.');
    return null;
  }

  return <div className="CWTabsRow">{childrenArray}</div>;
};

export default CWTabsRow;
