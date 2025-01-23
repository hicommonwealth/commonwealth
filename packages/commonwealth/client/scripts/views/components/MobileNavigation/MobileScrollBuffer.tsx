import React from 'react';
import { useQuickPostButtonActivated } from 'views/components/MobileNavigation/useQuickPostButtonActivated';
import './MobileScrollBuffer.scss';

/**
 * Disabling this now, but we're going to enable this again once I implement
 * parent element scroll detection
 */
const DISABLED = true;

export const MobileScrollBuffer = () => {
  const activated = useQuickPostButtonActivated();

  if (DISABLED || !activated) {
    return null;
  }

  return (
    <div className="MobileScrollBuffer">
      <div />
    </div>
  );
};
