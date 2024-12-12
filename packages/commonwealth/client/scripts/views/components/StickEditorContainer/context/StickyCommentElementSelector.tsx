import React, { memo } from 'react';
import { useActivatorContext } from 'views/components/StickEditorContainer/context/UseActivatorContext';

/**
 * This is the main element that we need to actually stick to the screen.
 *
 * This will first, try to display the active element (the comment reply), then
 * fall back to the default element (the main comment), or if nothing is being
 * used just return nothing.
 */
export const StickyCommentElementSelector = memo(
  function StickyCommentElementSelector() {
    const activator = useActivatorContext();

    if (activator.activeElement) {
      return <>{activator.activeElement}</>;
    }

    if (activator.defaultElement) {
      return <>{activator.defaultElement}</>;
    }

    return null;
  },
);
