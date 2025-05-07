import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stickyInputStore } from '../state/ui/stickyInput';
import { createDeltaFromText } from '../views/components/react_quill_editor';

/**
 * Custom hook that monitors route changes and resets the StickyInput state
 * when navigation occurs.
 *
 * @param setContentDelta Optional function to reset the editor content delta state
 */
const useResetStickyInputOnRouteChange = (
  setContentDelta?: React.Dispatch<React.SetStateAction<any>>,
): void => {
  const location = useLocation();

  useEffect(() => {
    // Reference to sync flag (if needed in component using this hook)
    const shouldSyncRef = (window as any).__stickyInputSyncRef;

    // Temporarily disable syncing if the ref exists
    if (shouldSyncRef) {
      shouldSyncRef.current = false;
    }

    // Reset the sticky input state whenever the route changes
    stickyInputStore.getState().resetState();

    // Also reset the editor content if provided
    if (setContentDelta) {
      setContentDelta(createDeltaFromText(''));
    }

    // Re-enable syncing after a short delay if the ref exists
    if (shouldSyncRef) {
      setTimeout(() => {
        shouldSyncRef.current = true;
      }, 100);
    }
  }, [location.pathname, setContentDelta]); // Only reset when the path changes, not on query param changes
};

export default useResetStickyInputOnRouteChange;
