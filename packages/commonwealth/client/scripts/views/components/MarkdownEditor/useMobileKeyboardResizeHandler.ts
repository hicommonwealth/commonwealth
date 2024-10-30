import { useCallback, useEffect, useRef } from 'react';
import { MarkdownEditorMode } from 'views/components/MarkdownEditor/MarkdownEditor';

/**
 * Do the actual keyboard resize now.
 */
function resizeRootElementForKeyboard() {
  // FIXME: add the mobile header for device height.

  if (!window.visualViewport) {
    console.warn('No visual viewport.');
    return;
  }

  // TODO: make BODY have the full height and root have a smaller height.

  const height = Math.floor(window.visualViewport.height);

  const elementToResize = document.getElementById('root');

  if (elementToResize) {
    elementToResize.style.maxHeight = `${height}px`;
  }

  //document.body.style.height = `${window.innerHeight}px`;

  document.body.style.height = `${height}px`;
}

/**
 * Because Safari and iOS have different keyboard handling mechanisms, we have
 * to listen for window resize (the keyboard becoming active) using
 * requestAnimationFrame.
 *
 * - Safari does NOT call the resize event when the keyboard is made active.
 * - Safari resizes the keyboard AFTER onMouseUp, so we can't listen for it
 *   that way either.
 *
 * Animation frames run 60x per second, and only when the UI repaints.
 *
 * This means that there will be no excessive power usage.
 *
 * We also, correctly , handle the component being shut down so there won't be
 * errant background animation frames.
 */
export const useMobileKeyboardResizeHandler = (mode: MarkdownEditorMode) => {
  const animationTaskRef = useRef<number | undefined>(undefined);

  const listenForResize = useCallback(() => {
    resizeRootElementForKeyboard();
    animationTaskRef.current = requestAnimationFrame(listenForResize);
  }, []);

  useEffect(() => {
    if (mode !== 'mobile') {
      // do nothing whatsoever on mobile.
      return;
    }

    // start the first resize, then continually call itself using
    // requestAnimationFrame
    listenForResize();

    return () => {
      if (animationTaskRef.current !== undefined) {
        // if there's an animation frame scheduled, we have to cancel it now
        // otherwise, it will just keep running forever.
        cancelAnimationFrame(animationTaskRef.current);
      }
    };
  }, [listenForResize, mode]);
};
