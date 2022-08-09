/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_checkbox.scss';

import { ComponentType, StyleAttrs } from './types';
import { getClasses } from './helpers';
import { CWText } from './cw_text';

type Checkbox = { label?: string; value: string };

type CheckboxStyleAttrs = {
  checked: boolean;
  indeterminate?: boolean;
} & StyleAttrs;

type CheckboxAttrs = {
  groupName: string;
  onchange: (e?: any) => void;
} & Checkbox &
  CheckboxStyleAttrs;

export class CWCheckbox implements m.ClassComponent<CheckboxAttrs> {
  view(vnode) {
    const {
      className,
      disabled = false,
      groupName,
      indeterminate = false,
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
      type: 'checkbox',
      value,
    };

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
        <CWText>{label || value}</CWText>
      </label>
    );
  }
}
