import clsx from 'clsx';
import React from 'react';

import useSidebarStore from 'state/ui/sidebar';
import { ComponentType } from 'views/components/component_kit/types';

import './CWGrid.scss';

interface CWGridProps {
  children: React.ReactNode;
}

const CWGrid = ({ children }: CWGridProps) => {
  const { menuVisible } = useSidebarStore();

  const childrenArray = React.Children.toArray(children).filter(
    (child) => child !== null,
  );

  return (
    <div
      className={clsx(ComponentType.Grid, {
        'menu-visible': menuVisible,
        'single-child': childrenArray.length === 1,
      })}
    >
      {children}
    </div>
  );
};

export default CWGrid;
