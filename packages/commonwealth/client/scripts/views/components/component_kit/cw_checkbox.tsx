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

import 'components/component_kit/cw_checkbox.scss';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import type { StyleAttrs } from './types';
import { ComponentType } from './types';

export type CheckboxType = { label?: string; value?: string };

type CheckboxStyleAttrs = {
  checked?: boolean;
  indeterminate?: boolean;
} & StyleAttrs;

type CheckboxAttrs = {
  groupName?: string;
  onChange?: (e?: any) => void;
} & CheckboxType &
  CheckboxStyleAttrs;

export class CWCheckbox extends ClassComponent<CheckboxAttrs> {
  view(vnode: ResultNode<CheckboxAttrs>) {
    const {
      className,
      disabled = false,
      indeterminate = false,
      label,
      onChange,
      checked,
      value,
    } = vnode.attrs;

    const params = {
      disabled,
      onChange,
      checked,
      type: 'checkbox',
      value,
    };

    return (
      <label
        className={getClasses<CheckboxStyleAttrs>(
          {
            checked,
            disabled,
            indeterminate,
            className,
          },
          ComponentType.Checkbox
        )}
      >
        <input className="checkbox-input" {...params} />
        <div className="checkbox-control" />
        <CWText className="checkbox-label">{label || value}</CWText>
      </label>
    );
  }
}
