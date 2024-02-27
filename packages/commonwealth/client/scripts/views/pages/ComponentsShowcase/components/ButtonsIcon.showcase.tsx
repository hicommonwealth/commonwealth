import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';

const ButtonsIconShowcase = () => {
  return (
    <>
      <CWText type="h5">Size</CWText>

      <div className="flex-row">
        <CWText>Sm</CWText>
        <CWIconButton iconName="plusCirclePhosphor" buttonSize="sm" />
        <CWText>Md</CWText>
        <CWIconButton iconName="plusCirclePhosphor" buttonSize="med" />
        <CWText>Lg</CWText>
        <CWIconButton iconName="plusCirclePhosphor" buttonSize="lg" />
      </div>

      <CWText type="h5">Disabled</CWText>

      <div className="flex-row">
        <CWIconButton iconName="plusCirclePhosphor" buttonSize="sm" disabled />
        <CWIconButton iconName="plusCirclePhosphor" buttonSize="med" disabled />
        <CWIconButton iconName="plusCirclePhosphor" buttonSize="lg" disabled />
      </div>
    </>
  );
};

export default ButtonsIconShowcase;
