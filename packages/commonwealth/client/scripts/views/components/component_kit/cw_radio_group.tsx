/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_radio_group.scss';

import type { RadioButtonType } from './cw_radio_button';
import { CWRadioButton } from './cw_radio_button';
import { ComponentType } from './types';

type RadioGroupAttrs = {
  name: string;
  onChange: (e?: any) => void;
  options: Array<RadioButtonType>;
  toggledOption?: string;
};

export class CWRadioGroup extends ClassComponent<RadioGroupAttrs> {
  view(vnode: ResultNode<RadioGroupAttrs>) {
    const { options, onChange, name, toggledOption } = vnode.attrs;

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
  }
}
