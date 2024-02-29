import React from 'react';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';

const BreadcrumbsShowcase = () => {
  return (
    <>
      <CWBreadcrumbs
        breadcrumbs={[
          { label: 'Page' },
          { label: 'Page' },
          { label: 'Page' },
          { label: 'Current' },
        ]}
      />
    </>
  );
};

export default BreadcrumbsShowcase;
