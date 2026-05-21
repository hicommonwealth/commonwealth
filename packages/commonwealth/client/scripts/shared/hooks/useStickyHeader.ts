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
  zIndex = 999,
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

    if (stickyBehaviourEnabled) {
      window.addEventListener('wheel', listener);
    }

    return () => {
      window.removeEventListener('wheel', listener);
    };
  }, [stickyBehaviourEnabled, elementId, zIndex, top]);
};

export default useStickyHeader;
