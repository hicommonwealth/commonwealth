import clsx from 'clsx';
import React from 'react';

import { ComponentType } from 'views/components/component_kit/types';

import { ButtonType } from './types';
import useCWPagination from './useCWPagination';

import './CWPagination.scss';

interface CWPaginationProps {
  totalCount: number;
  className?: string;
}

const CWPagination = ({ totalCount, className }: CWPaginationProps) => {
  const { items } = useCWPagination({ totalCount });

  return (
    <div className={clsx(ComponentType.Pagination, className)}>
      {items.map((item, index) => {
        if (item.type === ButtonType.Previous) {
          return (
            <button onClick={item.onClick} disabled={item.disabled} key={index}>
              ⬅️ previous
            </button>
          );
        }

        if (item.type === ButtonType.Next) {
          return (
            <button onClick={item.onClick} disabled={item.disabled} key={index}>
              next ➡️
            </button>
          );
        }

        if (item.type === ButtonType.Page) {
          return (
            <button
              onClick={item.onClick}
              className={clsx({ active: item.selected })}
              key={index}
            >
              {item.pageNumber}
            </button>
          );
        }

        if (
          item.type === ButtonType.StartEllipsis ||
          item.type === ButtonType.EndEllipsis
        ) {
          return <button key={index}> ... </button>;
        }
      })}
    </div>
  );
};

export default CWPagination;
