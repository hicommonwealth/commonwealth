/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_radio_button.scss';
import m from 'mithril';
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
  onchange?: (e?: any) => void;
} & Omit<RadioButtonType, 'disabled'> &
  RadioButtonStyleAttrs;

export class CWRadioButton extends ClassComponent<RadioButtonAttrs> {
  view(vnode: m.Vnode<RadioButtonAttrs>) {
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
        class={getClasses<RadioButtonStyleAttrs>(
          {
            checked,
            disabled,
          },
          ComponentType.RadioButton
        )}
      >
        <input class="radio-input" {...params} />
        <div class="radio-control" />
        <CWText>{label || value}</CWText>
      </label>
    );
  }
}
