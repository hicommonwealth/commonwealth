/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_radio_button.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { CWText } from './cw_text';

export type RadioButtonType = {
  label?: string;
  value: string;
  disabled?: boolean;
};

type RadioButtonStyleAttrs = {
  disabled?: boolean;
  checked?: boolean;
};

type RadioButtonAttrs = {
  groupName?: string;
  onchange?: (e?: any) => void;
} & Omit<RadioButtonType, 'disabled'> &
  RadioButtonStyleAttrs;

export class CWRadioButton extends ClassComponent<RadioButtonAttrs> {
  view(vnode: ResultNode<RadioButtonAttrs>) {
    const {
      disabled = false,
      groupName,
      label,
      onchange,
      checked,
      value,
    } = vnode.attrs;

    const params = {
      disabled,
      name: groupName,
      onchange,
      checked,
      type: 'radio',
      value,
    };

    return (
      <label
        className={getClasses<RadioButtonStyleAttrs>(
          {
            checked,
            disabled,
          },
          ComponentType.RadioButton
        )}
      >
        <input className="radio-input" {...params} />
        <div className="radio-control" />
        <CWText>{label || value}</CWText>
      </label>
    );
  }
}
