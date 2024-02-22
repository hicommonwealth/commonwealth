import React from 'react';

import { ComponentType } from 'views/components/component_kit/types';

import './CWPageLayout.scss';

interface CWPageLayoutProps {
  children: React.ReactNode;
}

const CWPageLayout = ({ children }: CWPageLayoutProps) => {
  return (
    <div className={ComponentType.PageLayout}>
      <div className="layout-container">{children}</div>
    </div>
  );
};

export default CWPageLayout;
