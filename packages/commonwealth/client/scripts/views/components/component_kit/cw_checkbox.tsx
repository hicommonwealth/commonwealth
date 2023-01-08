/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_checkbox.scss';
import m from 'mithril';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import { ComponentType, StyleAttrs } from './types';

export type CheckboxType = { label?: string; value?: string };

type CheckboxStyleAttrs = {
  checked?: boolean;
  indeterminate?: boolean;
} & StyleAttrs;

type CheckboxAttrs = {
  groupName?: string;
  onchange?: (e?: any) => void;
} & CheckboxType &
  CheckboxStyleAttrs;

export class CWCheckbox extends ClassComponent<CheckboxAttrs> {
  view(vnode: m.Vnode<CheckboxAttrs>) {
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
