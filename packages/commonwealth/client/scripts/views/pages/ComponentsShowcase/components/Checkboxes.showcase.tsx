import React, { useState } from 'react';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';

const CheckboxesShowcase = () => {
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  return (
    <>
      <CWCheckbox
        checked={isCheckboxChecked}
        label="Click me"
        onChange={() => {
          setIsCheckboxChecked(!isCheckboxChecked);
        }}
      />
      <CWCheckbox label="Disabled" disabled />
      <CWCheckbox label="Checked and disabled" disabled checked />
    </>
  );
};

export default CheckboxesShowcase;
