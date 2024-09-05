import React from 'react';

import CWCircleRingSpinner from 'views/components/component_kit/new_designs/CWCircleRingSpinner';
import './UploadIndicator.scss';

export const UploadIndicator = () => {
  return (
    <div className="UploadIndicator">
      <div className="inner">
        <CWCircleRingSpinner />
      </div>
    </div>
  );
};
