import React from 'react';

import './UploadIndicator.scss';
import CWCircleRingSpinner
  from 'views/components/component_kit/new_designs/CWCircleRingSpinner';

export const UploadIndicator = () => {
  return (
    <div className="UploadIndicator">
      <div className="inner">
        <CWCircleRingSpinner/>
      </div>
    </div>
  );
};
