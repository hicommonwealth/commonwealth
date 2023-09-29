import { MutableRefObject, useEffect } from 'react';
import useBrowserWindow from 'hooks/useBrowserWindow';

// There is no way to apply styles to first element of wrapped element with CSS.
// This function calculates when the AuthorAndPublishInfo container is becoming
// multiline and applies the left margin to the first element of each line except
// the first element in the first line.
const applyLeftMarginToItems = (
  containerRef: MutableRefObject<HTMLDivElement>
) => {
  const container = containerRef.current;

  if (!container) {
    console.error('Container not found.');
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const children = Array.from(container.children);

  let rowTop = containerRect.top;

  children.forEach((child, index) => {
    const childRect = child.getBoundingClientRect();

    // Check if the child is in a new row
    if (childRect.top > rowTop) {
      rowTop = childRect.top;

      // Apply left margin to the first item in the new row
      (child as HTMLDivElement).style.marginLeft = index > 0 ? '30px' : 'unset';
    } else {
      // Apply 'unset' left margin for elements that used to be first, but
      // eg after screen resize, they are not first element in line anymore.
      (child as HTMLDivElement).style.marginLeft = index > 0 && 'unset';
    }
  });
};

// Design request was to wrap author metadata in such way, that the items do not
// cover vertical lines visible in nested comments. There is no way to target
// with CSS first elements in wrapped line, so a bit of JS comes in handy here.
// This hook calls 'applyLeftMarginToItems' on first page load and also when the
// screen is changing its size, to make sure that the layout is updated correctly.

const useAuthorMetadataCustomWrap = (
  containerRef: MutableRefObject<HTMLDivElement>
) => {
  useEffect(() => {
    applyLeftMarginToItems(containerRef);
  }, [containerRef]);

  useBrowserWindow({
    onResize: () => applyLeftMarginToItems(containerRef),
    resizeListenerUpdateDeps: [],
  });
};

export default useAuthorMetadataCustomWrap;
