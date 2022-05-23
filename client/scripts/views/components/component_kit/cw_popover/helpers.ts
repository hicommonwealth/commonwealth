// Source: https://github.com/Simspace/monorail/blob/master/src/metaComponents/popOver/PopOver.tsx

export const getPopoverPosition = ({
  trigger,
  container,
  arrowSize = 8,
  gapSize = 1,
  toSide = false,
}: {
  trigger: Element;
  container: Element;
  arrowSize: number;
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
      contentLeftXAmount =
        triggerBoundingRect.left -
        (containerBoundingRect.width - triggerBoundingRect.width) / 2;
      contentTopYAmount = Math.max(
        0,
        triggerBoundingRect.top -
          arrowSize -
          containerBoundingRect.height -
          gapSize
      );

      arrowLeftXAmount =
        triggerBoundingRect.left + triggerBoundingRect.width / 2 - 8;
      arrowTopYAmount = triggerBoundingRect.top - 8 - gapSize;

      break;
    }
    case 'below': {
      contentLeftXAmount =
        triggerBoundingRect.left -
        (containerBoundingRect.width - triggerBoundingRect.width) / 2;
      contentTopYAmount = triggerBoundingRect.bottom + arrowSize + gapSize;

      arrowLeftXAmount =
        triggerBoundingRect.left + triggerBoundingRect.width / 2 - 8;
      arrowTopYAmount = triggerBoundingRect.bottom + gapSize;
      break;
    }
    case 'left': {
      // TODO: Do we actually need this case?
      break;
    }
    case 'right': {
      contentLeftXAmount = triggerBoundingRect.right + arrowSize + gapSize;
      contentTopYAmount =
        triggerBoundingRect.top -
        (containerBoundingRect.height - triggerBoundingRect.height) / 2;

      arrowLeftXAmount = triggerBoundingRect.right + gapSize;
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

export const checkIfCursorInBounds = (offsetX, offsetY, target: Element) => {
  const targetBoundingRect = target.getBoundingClientRect();

  if (
    offsetX < targetBoundingRect.right &&
    offsetX > targetBoundingRect.left &&
    offsetY < targetBoundingRect.bottom &&
    offsetY > targetBoundingRect.top
  ) {
    return true;
  }
  return false;
};

export function findRef(dom, ref) {
  return dom.matches(`[ref=${ref}]`) ? dom : dom.querySelector(`[ref=${ref}]`);
}
