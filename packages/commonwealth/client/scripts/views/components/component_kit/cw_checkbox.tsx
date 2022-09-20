/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_checkbox.scss';

import { ComponentType, StyleAttrs } from './types';
import { getClasses } from './helpers';
import { CWText } from './cw_text';

export type CheckboxType = {
  label?: string;
  value: string;
  disabled?: boolean;
};

type CheckboxStyleAttrs = {
  checked: boolean;
  indeterminate?: boolean;
} & StyleAttrs;

type CheckboxAttrs = {
  onchange: (e?: any) => void;
} & Omit<CheckboxType, 'disabled'> &
  CheckboxStyleAttrs;

export class CWCheckbox implements m.ClassComponent<CheckboxAttrs> {
  view(vnode) {
    const {
      className,
      disabled = false,
      indeterminate = false,
      label,
      onchange,
      checked,
      value,
    } = vnode.attrs;

    const params = {
      disabled,
      onchange,
      checked,
      type: 'checkbox',
      value,
    };

    console.log('inside checkbox', value, checked);

    return (
      <label
        class={getClasses<CheckboxStyleAttrs>(
          {
            checked,
            disabled,
            indeterminate,
            className,
          },
          ComponentType.Checkbox
        )}
      >
        <input class="checkbox-input" {...params} />
        <div class="checkbox-control" />
        <CWText className="checkbox-label">{label || value}</CWText>
      </label>
    );
  }
}
