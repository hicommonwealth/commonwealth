import React from 'react';

import 'components/component_kit/cw_radio_button.scss';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

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

  const params = {
    disabled,
    name: groupName,
    onChange,
    checked,
    type: 'radio',
    value,
  };

  return (
    <label
      className={getClasses<RadioButtonStyleProps>(
        {
          checked,
          disabled,
        },
        ComponentType.RadioButton,
      )}
    >
      <input className="radio-input" {...params} />
      <div className="radio-control" />
      <CWText>{label || value}</CWText>
    </label>
  );
};
