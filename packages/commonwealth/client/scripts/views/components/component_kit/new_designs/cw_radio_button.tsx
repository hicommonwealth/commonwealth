import React, { useEffect, useState, ReactNode } from 'react';
import { Circle, RadioButton } from '@phosphor-icons/react';

import 'components/component_kit/new_designs/cw_radio_button.scss';
import { CWText } from '../cw_text';

export type RadioButtonType = {
  label?: string | ReactNode;
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
    onChange?.();
  };

  // For Storybook checked control
  useEffect(() => setIsChecked(checked), [checked]);

  const commonProps = {
    name: groupName,
    onClick: handleClick,
  };

  return (
    <div className="container">
      <input
        type="radio"
        className={`radio-button2 ${disabled ? 'disabled' : ''}`}
        {...commonProps}
      />
      <CWText className="label" type="b2" fontWeight="regular">
        {label || value}
      </CWText>
    </div>
  );
};
