import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/CWCircleMultiplySpinner';
import CWCircleRingSpinner from 'views/components/component_kit/CWCircleRingSpinner';

const LoadersShowcase = () => {
  return (
    <>
      <CWText type="h5">Multiply</CWText>
      <CWCircleMultiplySpinner center={false} />

      <CWText type="h5">Ring</CWText>
      <CWCircleRingSpinner />
    </>
  );
};

export default LoadersShowcase;
