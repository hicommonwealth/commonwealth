import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleButton from 'views/components/component_kit/new_designs/CWCircleButton';

const ButtonsCircleShowcase = () => {
  return (
    <>
      <CWText type="h5">Type</CWText>
      <div className="flex-row">
        <CWText>Primary</CWText>
        <CWCircleButton iconName="plusCirclePhosphor" buttonType="primary" />
        <CWText>Secondary</CWText>
        <CWCircleButton iconName="plusCirclePhosphor" buttonType="secondary" />
      </div>

      <CWText type="h5">Disabled</CWText>
      <div className="flex-row">
        <CWText>Primary</CWText>
        <CWCircleButton
          iconName="plusCirclePhosphor"
          buttonType="primary"
          disabled
        />
        <CWText>Secondary</CWText>
        <CWCircleButton
          iconName="plusCirclePhosphor"
          buttonType="secondary"
          disabled
        />
      </div>
    </>
  );
};

export default ButtonsCircleShowcase;
