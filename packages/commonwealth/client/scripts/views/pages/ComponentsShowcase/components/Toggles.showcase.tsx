import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';

const TogglesShowcase = () => {
  const [isSmallToggled, setIsSmallToggled] = useState(false);
  const [isLargeToggled, setIsLargeToggled] = useState(false);

  return (
    <>
      <CWText type="h5">Size</CWText>
      <div className="flex-row">
        <CWText>Small</CWText>
        <CWToggle
          checked={isSmallToggled}
          size="small"
          onChange={() => setIsSmallToggled(!isSmallToggled)}
        />
        <CWText>Large</CWText>
        <CWToggle
          checked={isLargeToggled}
          size="large"
          onChange={() => setIsLargeToggled(!isLargeToggled)}
        />
      </div>

      <CWText type="h5">Disabled</CWText>
      <div className="flex-row">
        <CWText>Small</CWText>
        <CWToggle disabled checked={true} size="small" />
        <CWText>Large</CWText>
        <CWToggle disabled checked={false} size="large" />
      </div>
    </>
  );
};

export default TogglesShowcase;
