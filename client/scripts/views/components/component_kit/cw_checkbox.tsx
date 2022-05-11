/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_checkbox.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { CWText } from './cw_text';

type Checkbox = { label?: string; value: string };

type CheckboxStyleAttrs = {
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
};

type CheckboxAttrs = {
  groupName: string;
  onchange: (e?: any) => void;
} & Checkbox &
  CheckboxStyleAttrs;

export class CWCheckbox implements m.ClassComponent<CheckboxAttrs> {
  view(vnode) {
    const {
      disabled = false,
      groupName,
      indeterminate = false,
      label,
      onchange,
      checked,
      value,
    } = vnode.attrs;

    console.log(this);

    const params = {
      disabled,
      name: groupName,
      onchange,
      checked,
      type: 'checkbox',
      value,
    };

    // console.log(this);

    return (
      <label
        class={getClasses<CheckboxStyleAttrs>(
          {
            checked,
            disabled,
            indeterminate,
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
