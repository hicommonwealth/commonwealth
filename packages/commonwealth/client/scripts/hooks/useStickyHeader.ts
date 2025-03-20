import { useEffect } from 'react';

type StickyHeaderProps = {
  elementId: string;
  zIndex?: number;
  top?: number;
  stickyBehaviourEnabled?: boolean;
};

// Imp: this hook assumes that the container holding the sticky element (aka `elementId` below) is
// having a `position: relative` property applied
const useStickyHeader = ({
  elementId,
  zIndex = 10, // Default to a much lower z-index
  top = 0,
  stickyBehaviourEnabled = true,
}: StickyHeaderProps) => {
  useEffect(() => {
    const stickyElement = document.getElementById(elementId);

    const updateStickyBehaviour = (isSticky = false) => {
      if (stickyElement?.style) {
        stickyElement.style.position = isSticky ? 'sticky' : 'initial';
        stickyElement.style.top = isSticky ? `${top}px` : 'initial';
        stickyElement.style.zIndex = isSticky ? `${zIndex}` : 'initial';
      }
    };

    updateStickyBehaviour(stickyBehaviourEnabled);
    if (!stickyBehaviourEnabled) return;

    const listener = () => {
      if (stickyElement?.getBoundingClientRect && stickyBehaviourEnabled) {
        const stickyElementPos = stickyElement.getBoundingClientRect();
        // checks if user scroll past this element
        const hasTabsSectionReachedTop =
          stickyElementPos.top - top - stickyElementPos.height <= 0;
        updateStickyBehaviour(hasTabsSectionReachedTop);
      }
    };

    // Use both wheel and scroll events for better responsiveness
    if (stickyBehaviourEnabled) {
      window.addEventListener('wheel', listener);
      window.addEventListener('scroll', listener);
    }

    return () => {
      window.removeEventListener('wheel', listener);
      window.removeEventListener('scroll', listener);

      // Clean up any sticky behavior when unmounting
      if (stickyElement?.style) {
        stickyElement.style.position = 'initial';
        stickyElement.style.top = 'initial';
        stickyElement.style.zIndex = 'initial';
      }
    };
  }, [stickyBehaviourEnabled, elementId, zIndex, top]);
};

export default useStickyHeader;
