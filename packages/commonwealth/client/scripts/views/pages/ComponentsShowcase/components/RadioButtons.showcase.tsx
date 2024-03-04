import React, { useState } from 'react';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';

const RadioButtonsShowcase = () => {
  const [isRadioOneChecked, setIsRadioOneChecked] = useState(false);
  const [isRadioTwoChecked, setIsRadioTwoChecked] = useState(false);

  return (
    <>
      <CWRadioButton
        groupName="group"
        value="radio1"
        label="Radio One"
        checked={isRadioOneChecked}
        onChange={() => setIsRadioOneChecked(true)}
      />
      <CWRadioButton
        groupName="group"
        value="radio2"
        label="Radio Two"
        checked={isRadioTwoChecked}
        onChange={() => setIsRadioTwoChecked(true)}
      />
      <CWRadioButton
        value="Radio Button"
        label="Radio Button Disabled"
        disabled
      />
    </>
  );
};

export default RadioButtonsShowcase;
