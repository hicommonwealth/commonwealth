import clsx from 'clsx';
import React from 'react';

import useBrowserWindow from 'hooks/useBrowserWindow';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { ComponentType } from 'views/components/component_kit/types';

import { ButtonType } from './types';
import useCWPagination, { UseCWPaginationProps } from './useCWPagination';

import './CWPagination.scss';

interface CWPaginationProps extends UseCWPaginationProps {
  className?: string;
}

/**
 * @param totalCount total count of pages for pagination
 * @param boundaryCount number of buttons to show between (previous button and start ellipsis)
 * or (end ellipsis and next button)
 * @param siblingCount number of buttons to show before and after the current page
 * @param onChange onClick handler for pagination
 * @param selectedPageProp externally modify which page is selected
 * @param className className for pagination container
 */
const CWPagination = ({
  totalCount,
  boundaryCount,
  siblingCount,
  onChange,
  selectedPageProp,
  className,
}: CWPaginationProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});

  const { items } = useCWPagination({
    totalCount,
    boundaryCount,
    onChange,
    siblingCount: siblingCount || isWindowExtraSmall ? 0 : 1,
    selectedPageProp,
  });

  return (
    <div className={clsx(ComponentType.Pagination, className)}>
      {items.map((item, index) => {
        if (item.type === ButtonType.Previous) {
          return (
            <button
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              key={index}
              className={ButtonType.Previous}
            >
              <CWIcon iconSize="small" iconName="arrowLeftPhosphor" />
              <CWText type="buttonSm">Previous</CWText>
            </button>
          );
        }

        if (item.type === ButtonType.Next) {
          return (
            <button
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              key={index}
              className={ButtonType.Next}
            >
              <CWText type="buttonSm">Next</CWText>
              <CWIcon iconSize="small" iconName="arrowRightPhosphor" />
            </button>
          );
        }

        if (item.type === ButtonType.Page) {
          return (
            <button
              type="button"
              onClick={item.onClick}
              className={clsx({ selected: item.selected })}
              key={index}
            >
              <CWText type="buttonSm">{item.pageNumber}</CWText>
            </button>
          );
        }

        if (
          item.type === ButtonType.StartEllipsis ||
          item.type === ButtonType.EndEllipsis
        ) {
          return (
            <button type="button" key={index}>
              ...
            </button>
          );
        }
      })}
    </div>
  );
};

export default CWPagination;
