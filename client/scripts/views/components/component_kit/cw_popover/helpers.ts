// Source: https://github.com/Simspace/monorail/blob/master/src/metaComponents/popOver/PopOver.tsx

import {
  dropDirections,
  dropXDirectionType,
  dropYDirectionType,
  GetFunctionAttrs,
  GetFunctionXAttrs,
  GetFunctionYAttrs,
} from './types';

const getDropXAmount: (attrs: GetFunctionXAttrs) => {
  dropXAmount: number;
} = ({ dropXDirection, innerWidth, boundingRect, toSide, gap }) => {
  const isLeft = dropXDirection === dropDirections.Left;

  const dropXAmountForToSide = () =>
    isLeft
      ? boundingRect.left + boundingRect.width + gap
      : innerWidth - boundingRect.right + boundingRect.width + gap;

  const dropXAmountForNotToSide = () =>
    isLeft ? boundingRect.left : innerWidth - boundingRect.right;

  return {
    dropXAmount: toSide ? dropXAmountForToSide() : dropXAmountForNotToSide(),
  };
};

const getDropYAmount: (attrs: GetFunctionYAttrs) => {
  dropYAmount: number;
} = ({ dropYDirection, innerHeight, boundingRect, toSide, gap }) => {
  const isTop = dropYDirection === dropDirections.Top;

  const dropYAmountForToSide = () =>
    isTop ? boundingRect.top : innerHeight - boundingRect.bottom;

  const dropYAmountForNotToSide = () =>
    isTop
      ? boundingRect.top + boundingRect.height + gap
      : boundingRect.bottom + gap;

  return {
    dropYAmount: toSide ? dropYAmountForToSide() : dropYAmountForNotToSide(),
  };
};

const getMaxHeight: (attrs: GetFunctionYAttrs) => {
  maxHeight: number;
} = ({ dropYDirection, innerHeight, boundingRect, toSide, gap }) => {
  const isTop = dropYDirection === dropDirections.Top;

  const maxHeightForToSide = () =>
    isTop
      ? innerHeight - boundingRect.top - gap * 2
      : boundingRect.top + boundingRect.height - gap * 2;

  const maxHeightForNotToSide = () =>
    isTop
      ? innerHeight - (boundingRect.top + boundingRect.height) - gap * 2
      : boundingRect.top - gap * 2;

  return { maxHeight: toSide ? maxHeightForToSide() : maxHeightForNotToSide() };
};

const getMaxWidth: (attrs: GetFunctionXAttrs) => {
  maxWidth: number;
} = ({ dropXDirection, innerWidth, boundingRect, toSide, gap }) => {
  const isLeft = dropXDirection === dropDirections.Left;

  const maxWidthForToSide = () =>
    isLeft
      ? innerWidth - boundingRect.left - boundingRect.width - gap * 2
      : boundingRect.left - gap * 2;

  const maxWidthForNotToSide = () =>
    isLeft
      ? innerWidth - boundingRect.left - gap * 2
      : boundingRect.left + boundingRect.width - gap * 2;

  return { maxWidth: toSide ? maxWidthForToSide() : maxWidthForNotToSide() };
};

const getMaxHeightCalc: (attrs: GetFunctionYAttrs) => {
  maxHeightCalc: string;
} = ({ dropYDirection, innerHeight, boundingRect, toSide, gap }) => {
  const isTop = dropYDirection === dropDirections.Top;

  const maxHeightForToSide = () =>
    isTop
      ? `calc(100vh - ${boundingRect.bottom + gap * 2}px)`
      : `calc(100vh - ${innerHeight - boundingRect.bottom + gap}px)`;

  const maxHeightForNotToSide = () =>
    isTop
      ? `calc(100vh - ${boundingRect.bottom + gap * 2}px)`
      : `calc(100vh - ${innerHeight - boundingRect.top + gap * 2}px)`;

  return {
    maxHeightCalc: toSide ? maxHeightForToSide() : maxHeightForNotToSide(),
  };
};

const getMaxWidthCalc: (attrs: GetFunctionXAttrs) => {
  maxWidthCalc: string;
} = ({ dropXDirection, innerWidth, boundingRect, toSide, gap }) => {
  const isLeft = dropXDirection === dropDirections.Left;

  const maxWidthForToSide = () =>
    isLeft
      ? `calc(100vw - ${boundingRect.right + gap * 2}px)`
      : `calc(100vw - ${innerWidth - boundingRect.left + gap}px)`;

  const maxWidthForNotToSide = () =>
    isLeft
      ? `calc(100vw - ${boundingRect.left + gap}px)`
      : `calc(100vw - ${innerWidth - boundingRect.right + gap}px)`;

  return {
    maxWidthCalc: toSide ? maxWidthForToSide() : maxWidthForNotToSide(),
  };
};

const getDropAmounts: (attrs: GetFunctionAttrs) => {
  dropXAmount: number;
  dropYAmount: number;
  maxHeight: number;
  maxWidth: number;
  maxHeightCalc: string;
  maxWidthCalc: string;
} = ({
  dropXDirection,
  dropYDirection,
  innerHeight,
  innerWidth,
  ...otherAttrs
}) => ({
  ...getDropXAmount({ dropXDirection, innerWidth, ...otherAttrs }),
  ...getDropYAmount({ dropYDirection, innerHeight, ...otherAttrs }),
  ...getMaxHeight({ dropYDirection, innerHeight, ...otherAttrs }),
  ...getMaxWidth({ dropXDirection, innerWidth, ...otherAttrs }),
  ...getMaxHeightCalc({ dropYDirection, innerHeight, ...otherAttrs }),
  ...getMaxWidthCalc({ dropXDirection, innerWidth, ...otherAttrs }),
});

export const getPopoverPosition = ({
  trigger,
  container,
  gapSize = 8,
  toSide = false,
}: {
  trigger: Element;
  container: Element;
  gapSize: number;
  toSide: boolean;
}) => {
  const triggerBoundingRect = trigger.getBoundingClientRect();
  const containerBoundingRect = container.getBoundingClientRect();

  let popoverPlacement;
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;

  // Calculate whether to put popover above or below, or left or right
  if (toSide) {
    const distanceToLeft = triggerBoundingRect.left;
    const distanceToRight = innerWidth - triggerBoundingRect.right;

    if (distanceToLeft > distanceToRight) {
      popoverPlacement = 'left';
    } else {
      popoverPlacement = 'right';
    }
  } else {
    const distanceToTop = triggerBoundingRect.top;
    const distanceToBottom = innerHeight - triggerBoundingRect.bottom;

    if (distanceToTop > distanceToBottom) {
      popoverPlacement = 'above';
    } else {
      popoverPlacement = 'below';
    }
  }
  // Calculate the inline styles for positioning
  let contentLeftXAmount;
  let contentTopYAmount;
  let arrowLeftXAmount;
  let arrowTopYAmount;
  let showArrow;

  switch (popoverPlacement) {
    case 'above': {
      // Align left with left of target (centering happens in cw_popover)
      contentLeftXAmount =
        triggerBoundingRect.left -
        (containerBoundingRect.width - triggerBoundingRect.width) / 2;
      contentTopYAmount = Math.max(
        0,
        triggerBoundingRect.top - gapSize - containerBoundingRect.height
      );

      arrowLeftXAmount =
        triggerBoundingRect.left + triggerBoundingRect.width / 2 - 8;
      arrowTopYAmount = triggerBoundingRect.top - 8;

      break;
    }
    case 'below': {
      contentLeftXAmount =
        triggerBoundingRect.left -
        (containerBoundingRect.width - triggerBoundingRect.width) / 2;
      contentTopYAmount = triggerBoundingRect.bottom + gapSize;

      arrowLeftXAmount =
        triggerBoundingRect.left + triggerBoundingRect.width / 2 - 8;
      arrowTopYAmount = triggerBoundingRect.bottom;
      break;
    }
    case 'left': {
      // TODO: Do we actually need this case?
      break;
    }
    case 'right': {
      contentLeftXAmount = triggerBoundingRect.right + gapSize;
      contentTopYAmount =
        triggerBoundingRect.top -
        (containerBoundingRect.height - triggerBoundingRect.height) / 2;

      arrowLeftXAmount = triggerBoundingRect.right;
      arrowTopYAmount =
        triggerBoundingRect.top + triggerBoundingRect.height / 2 - 8;
      break;
    }
  }
  showArrow = contentTopYAmount != 0 ? true : false;
  return {
    contentLeftXAmount,
    contentTopYAmount,
    arrowLeftXAmount,
    arrowTopYAmount,
    popoverPlacement,
    showArrow,
  };

  // Calculate the maximum possible height this container can have, which will constrain the content
};

export const buildStyleString = ({
  leftXAmount,
  topYAmount,
  bottomYAmount,
}: {
  leftXAmount: number;
  topYAmount: number;
  bottomYAmount: number;
}) => {
  let styleString = '';
  if (leftXAmount) styleString += `left: ${leftXAmount}px;`;
  if (topYAmount) styleString += `top: ${topYAmount}px;`;
  if (bottomYAmount) styleString += `bottom: ${bottomYAmount}px;`;

  return styleString;
};

export const getPopoverPositionOld = ({
  target,
  gap = 8,
  toSide = false,
  xDirection,
  yDirection,
}: {
  target: Element;
  gap?: number;
  toSide?: boolean;
  xDirection?: dropXDirectionType;
  yDirection?: dropYDirectionType;
}) => {
  // Get basic dimensions about the the Toggle and the window.
  const boundingRect = target.getBoundingClientRect();
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;

  // Determine the direction the PopOver should go.
  const dropYDirection: dropYDirectionType =
    yDirection ||
    (innerHeight / 2 > boundingRect.top + boundingRect.height / 2
      ? dropDirections.Top
      : dropDirections.Bottom);

  const dropXDirection: dropXDirectionType =
    xDirection ||
    (innerWidth / 2 > boundingRect.left + boundingRect.width / 2
      ? dropDirections.Left
      : dropDirections.Right);

  return {
    ...getDropAmounts({
      boundingRect,
      dropXDirection,
      dropYDirection,
      gap,
      innerHeight,
      innerWidth,
      toSide,
    }),
    dropXDirection,
    dropYDirection,
    gap,
    originHeight: boundingRect.height,
    originWidth: boundingRect.width,
  };
};
