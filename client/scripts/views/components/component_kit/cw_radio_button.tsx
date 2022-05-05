/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_radio_button.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

type RadioButtonStyleAttrs = {
  disabled?: boolean;
  selected: boolean;
};

type RadioButtonAttrs = {
  groupName: string;
  label?: string;
  onchange: (e?: any) => void;
  value: string;
} & RadioButtonStyleAttrs;

export class CWRadioButton implements m.ClassComponent<RadioButtonAttrs> {
  view(vnode) {
    const {
      disabled = false,
      groupName,
      label,
      onchange,
      selected,
      value,
    } = vnode.attrs;

    const params = {
      disabled,
      name: groupName,
      onchange,
      selected: selected ? 'selected' : '',
      type: 'radio',
      value,
    };

    return (
      <label
        class={getClasses<RadioButtonStyleAttrs>(
          {
            selected,
            disabled,
          },
          ComponentType.RadioButton
        )}
      >
        <input class="radio-input" {...params} />
        <div class="radio-control" />
        <div class="radio-label">{label || value}</div>
      </label>
    );
  }
}
