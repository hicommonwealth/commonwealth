/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_radio_button.scss';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

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
  onChange?: (e?: any) => void;
} & Omit<RadioButtonType, 'disabled'> &
  RadioButtonStyleAttrs;

export class CWRadioButton extends ClassComponent<RadioButtonAttrs> {
  view(vnode: ResultNode<RadioButtonAttrs>) {
    const {
      disabled = false,
      groupName,
      label,
      onChange,
      checked,
      value,
    } = vnode.attrs;

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
