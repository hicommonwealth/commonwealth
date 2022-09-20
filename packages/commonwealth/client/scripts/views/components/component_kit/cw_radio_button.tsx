/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_radio_button.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { CWText } from './cw_text';

export type RadioButton = { label?: string; value: string; disabled?: boolean };

type RadioButtonStyleAttrs = {
  disabled?: boolean;
  checked: boolean;
};

type RadioButtonAttrs = {
  groupName: string;
  onchange: (e?: any) => void;
} & Omit<RadioButton, 'disabled'> &
  RadioButtonStyleAttrs;

export class CWRadioButton implements m.ClassComponent<RadioButtonAttrs> {
  view(vnode) {
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
