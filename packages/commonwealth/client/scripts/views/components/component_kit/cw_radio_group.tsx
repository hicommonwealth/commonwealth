import React from 'react';

import './cw_radio_group.scss';

import type { RadioButtonType } from './cw_radio_button';
import { CWRadioButton } from './cw_radio_button';
import { ComponentType } from './types';

type RadioGroupProps = {
  name: string;
  onChange: (e?: any) => void;
  options: Array<RadioButtonType>;
  toggledOption?: string;
};
export const CWRadioGroup = (props: RadioGroupProps) => {
  const { options, onChange, name, toggledOption } = props;

  return (
    <div className={ComponentType.RadioGroup}>
      {options.map((o, i) => {
        return (
          <CWRadioButton
            key={i}
            value={o.value}
            label={o.label}
            checked={o.value === toggledOption}
            groupName={name}
            onChange={onChange}
            disabled={o.disabled}
          />
        );
      })}
    </div>
  );
};
