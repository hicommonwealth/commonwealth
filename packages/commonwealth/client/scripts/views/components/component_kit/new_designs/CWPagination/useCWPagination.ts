import React, { useState } from 'react';

import { ButtonType } from './types';

export interface UseCWPaginationProps {
  totalCount: number;
  boundaryCount?: number;
  siblingCount?: number;
  onChange?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    newSelectedPage: number,
  ) => void;
  selectedPageProp?: number;
}

const useCWPagination = ({
  totalCount,
  boundaryCount = 1,
  siblingCount = 1,
  onChange: handleChange,
  selectedPageProp = 1,
}: UseCWPaginationProps) => {
  const [selectedPage, setSelectedPage] = useState(selectedPageProp);

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    newSelectedPage: number,
  ) => {
    setSelectedPage(newSelectedPage);

    if (handleChange) {
      handleChange(event, newSelectedPage);
    }
  };

  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const startPages = range(1, Math.min(boundaryCount, totalCount));
  const endPages = range(
    Math.max(totalCount - boundaryCount + 1, boundaryCount + 1),
    totalCount,
  );

  const siblingsStart = Math.max(
    Math.min(
      // Natural start
      selectedPage - siblingCount,
      // Lower boundary when page is high
      totalCount - boundaryCount - siblingCount * 2 - 1,
    ),
    // Greater than startPages
    boundaryCount + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(
      // Natural end
      selectedPage + siblingCount,
      // Upper boundary when page is low
      boundaryCount + siblingCount * 2 + 2,
    ),
    // Less than endPages
    endPages.length > 0 ? endPages[0] - 2 : totalCount - 1,
  );

  const siblingsStartPages =
    siblingsStart > boundaryCount + 2
      ? [ButtonType.StartEllipsis]
      : boundaryCount + 1 < totalCount - boundaryCount
        ? [boundaryCount + 1]
        : [];

  const siblingsEndPages =
    siblingsEnd < totalCount - boundaryCount - 1
      ? [ButtonType.EndEllipsis]
      : totalCount - boundaryCount > boundaryCount
        ? [totalCount - boundaryCount]
        : [];

  const itemList = [
    ButtonType.Previous,
    ...startPages,
    ...siblingsStartPages,
    ...range(siblingsStart, siblingsEnd),
    ...siblingsEndPages,
    ...endPages,
    ButtonType.Next,
  ];

  const buttonTypeToPageNumber = (type: ButtonType) => {
    switch (type) {
      case ButtonType.Previous:
        return selectedPage - 1;
      case ButtonType.Next:
        return selectedPage + 1;
      default:
        return null;
    }
  };

  const items = itemList.map((item) => {
    if (typeof item === 'number') {
      return {
        onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          handleClick(event, item);
        },
        type: ButtonType.Page,
        pageNumber: item,
        selected: item === selectedPage,
      };
    }

    const isEllipsis =
      item === ButtonType.StartEllipsis || item === ButtonType.EndEllipsis;
    const isPreviousDisabled =
      item === ButtonType.Previous && selectedPage <= 1;
    const isNextDisabled =
      item === ButtonType.Next && selectedPage >= totalCount;

    return {
      onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        // @ts-expect-error StrictNullChecks
        handleClick(event, buttonTypeToPageNumber(item));
      },
      type: item,
      pageNumber: buttonTypeToPageNumber(item),
      selected: false,
      disabled: isEllipsis ? false : isPreviousDisabled || isNextDisabled,
    };
  });

  return {
    items,
  };
};

export default useCWPagination;
