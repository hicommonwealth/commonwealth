import React from 'react';

import CWCircleRingSpinner from 'views/components/component_kit/new_designs/CWCircleRingSpinner';
import { Indicator } from 'views/components/MarkdownEditor/indicators/Indicator';

export const UploadIndicator = () => {
  return (
    <Indicator>
      <CWCircleRingSpinner size="xxl" />
    </Indicator>
  );
};
