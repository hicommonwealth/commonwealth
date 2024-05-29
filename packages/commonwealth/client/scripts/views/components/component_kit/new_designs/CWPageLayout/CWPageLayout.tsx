import clsx from 'clsx';
import React, { forwardRef } from 'react';

import { ComponentType } from 'views/components/component_kit/types';

import './CWPageLayout.scss';

interface CWPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const CWPageLayout = forwardRef<HTMLDivElement, CWPageLayoutProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={clsx(ComponentType.PageLayout, className)}>
        <div className="layout-container">{children}</div>
      </div>
    );
  },
);

CWPageLayout.displayName = 'CWPageLayout';

export default CWPageLayout;
