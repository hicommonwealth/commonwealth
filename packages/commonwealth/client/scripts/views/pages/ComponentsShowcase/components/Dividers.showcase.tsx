import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';

const DividersShowcase = () => {
  return (
    <>
      <CWText type="h5">Horizontal</CWText>
      <CWDivider />

      <CWText type="h5">Vertical</CWText>
      <CWDivider isVertical />
    </>
  );
};

export default DividersShowcase;
