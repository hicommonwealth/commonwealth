import React from 'react';

type BreadcrumbsTitleTagProps = {
  title: string;
};

export const BreadcrumbsTitleTag = (props: BreadcrumbsTitleTagProps) => {
  const { title } = props;

  return (
    <>
      {title}
      {/* something will eventually go here once we get breadcrumbs working */}
    </>
  );
};
