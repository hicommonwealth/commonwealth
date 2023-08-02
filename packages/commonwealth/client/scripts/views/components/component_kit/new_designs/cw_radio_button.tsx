import React, { useEffect, useState } from 'react';
import { Circle, RadioButton } from '@phosphor-icons/react';

import 'components/component_kit/new_designs/cw_radio_button.scss';
import { CWText } from '../cw_text';

export type RadioButtonType = {
  label?: string;
  value: string;
  disabled?: boolean;
};

type RadioButtonStyleProps = {
  disabled?: boolean;
  checked?: boolean;
};

type RadioButtonProps = {
  groupName?: string;
  onChange?: (e?: any) => void;
} & Omit<RadioButtonType, 'disabled'> &
  RadioButtonStyleProps;

export const CWRadioButton = (props: RadioButtonProps) => {
  const {
    disabled = false,
    groupName,
    label,
    onChange,
    checked,
    value,
  } = props;
  const [isChecked, setIsChecked] = useState<boolean>(checked);

  const handleClick = () => {
    if (!disabled) {
      setIsChecked(!isChecked);
    }
    onChange();
  };

  // For Storybook checked control
  useEffect(() => setIsChecked(checked), [checked]);

  const commonProps = {
    name: groupName,
    onClick: handleClick,
    size: 20,
  };

  return (
    <div className="container">
      {isChecked ? (
        <RadioButton
          className={`radio-button checked ${disabled ? 'disabled' : ''}`}
          {...commonProps}
          weight="fill"
        />
      ) : (
        <Circle
          className={`radio-button ${disabled ? 'disabled' : ''}`}
          {...commonProps}
          weight="regular"
        />
      )}
      <div className={disabled ? 'background' : ''} />
      <CWText className="label" type="b2" fontWeight="regular">
        {label || value}
      </CWText>
    </div>
  );
};
