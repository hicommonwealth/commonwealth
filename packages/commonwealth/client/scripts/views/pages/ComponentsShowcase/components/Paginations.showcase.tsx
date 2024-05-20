import React from 'react';

import CWPagination from 'views/components/component_kit/new_designs/CWPagination';

const PaginationsShowcase = () => {
  const handleChange = (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    newSelectedPage: number,
  ) => {
    console.log('Selected page: ', newSelectedPage);
  };

  return (
    <>
      <CWPagination totalCount={2} onChange={handleChange} />
      <CWPagination totalCount={7} onChange={handleChange} />
      <CWPagination totalCount={9} onChange={handleChange} />
      <CWPagination totalCount={20} onChange={handleChange} />
    </>
  );
};

export default PaginationsShowcase;
