export const getPosition = ({
  trigger,
  container,
  arrowSize = 8,
  gapSize = 1,
  toSide = false,
  tooltipOffset,
}: {
  trigger: Element;
  container: Element;
  arrowSize: number;
  gapSize: number;
  toSide: boolean;
  tooltipOffset?: number;
}) => {
  const triggerBoundingRect = trigger.getBoundingClientRect();
  const containerBoundingRect = container.getBoundingClientRect();

  let popoverPlacement;
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;

  // Calculate whether to put popover above or below, or left or right
  if (toSide) {
    popoverPlacement = 'right';
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

  switch (popoverPlacement) {
    case 'above': {
      if (tooltipOffset) {
        contentLeftXAmount = Math.max(
          tooltipOffset,
          triggerBoundingRect.left +
            triggerBoundingRect.width / 2 -
            tooltipOffset
        );
      } else {
        contentLeftXAmount = Math.max(
          triggerBoundingRect.left -
            (containerBoundingRect.width - triggerBoundingRect.width) / 2,
          10
        );
      }

      arrowLeftXAmount =
        triggerBoundingRect.left + triggerBoundingRect.width / 2 - arrowSize;

      contentTopYAmount = Math.max(
        0,
        triggerBoundingRect.top -
          arrowSize -
          containerBoundingRect.height -
          gapSize
      );

      arrowTopYAmount = triggerBoundingRect.top - arrowSize - gapSize;

      break;
    }
    case 'below': {
      if (tooltipOffset) {
        contentLeftXAmount = Math.max(
          tooltipOffset,
          triggerBoundingRect.left +
            triggerBoundingRect.width / 2 -
            tooltipOffset
        );
      } else {
        contentLeftXAmount = Math.max(
          triggerBoundingRect.left -
            (containerBoundingRect.width - triggerBoundingRect.width) / 2,
          10
        );
      }
      contentTopYAmount = triggerBoundingRect.bottom + arrowSize + gapSize;

      arrowLeftXAmount =
        triggerBoundingRect.left + triggerBoundingRect.width / 2 - arrowSize;
      arrowTopYAmount = triggerBoundingRect.bottom + gapSize;
      break;
    }
    case 'left': {
      // TODO: Do we actually need this case? I don't see a real necessity atm
      break;
    }
    case 'right': {
      contentLeftXAmount = triggerBoundingRect.right + arrowSize + gapSize;
      contentTopYAmount =
        triggerBoundingRect.top -
        (containerBoundingRect.height - triggerBoundingRect.height) / 2;

      arrowLeftXAmount = triggerBoundingRect.right + gapSize;
      arrowTopYAmount =
        triggerBoundingRect.top +
        triggerBoundingRect.height / 2 -
        arrowSize / 2;
      break;
    }
    default: {
      break;
    }
  }
  const showArrow = contentTopYAmount !== 0;

  return {
    contentLeftXAmount,
    contentTopYAmount,
    arrowLeftXAmount,
    arrowTopYAmount,
    popoverPlacement,
    showArrow,
  };
};

export const cursorInBounds = (
  offsetX: number,
  offsetY: number,
  target: Element
): boolean => {
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
