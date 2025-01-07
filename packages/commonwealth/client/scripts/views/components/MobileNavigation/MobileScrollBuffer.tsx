import React from 'react';
import { useQuickPostButtonActivated } from 'views/components/MobileNavigation/useQuickPostButtonActivated';
import './MobileScrollBuffer.scss';

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
