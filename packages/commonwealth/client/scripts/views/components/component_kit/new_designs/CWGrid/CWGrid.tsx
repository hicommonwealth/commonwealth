import React from 'react';

import { ComponentType } from 'views/components/component_kit/types';

import './CWGrid.scss';

interface CWGridProps {
  children: React.ReactNode;
}

const CWGrid = ({ children }: CWGridProps) => {
  return <div className={ComponentType.Grid}>{children}</div>;
};

export default CWGrid;
