import React from 'react';
import { useQuickPostButtonActivated } from 'views/components/MobileNavigation/useQuickPostButtonActivated';
import './MobileScrollBuffer.scss';

export const MobileScrollBuffer = () => {
  const activated = useQuickPostButtonActivated();

  if (!activated) {
    return null;
  }

  return (
    <div className="MobileScrollBuffer">
      <div />
    </div>
  );
};
