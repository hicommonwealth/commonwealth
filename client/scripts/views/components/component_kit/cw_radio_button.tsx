/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_radio_button.scss';

import { ComponentType } from './types';

export type RadioButtonAttrs = {
  value: string;
  label?: string;
  checked: boolean;
  groupName: string;
  // TODO: Gabe 1/14/22 type onchange for real
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onchange: (e?: any) => void;
  className?: string;
  // TODO: Gabe 1/14/22 disabled isn't used for anything
  disabled?: boolean;
};

export const CWRadioButton: m.Component<RadioButtonAttrs> = {
  view: (vnode) => {
    const { checked, value, label, groupName, onchange, className } =
      vnode.attrs;

    const params = {
      type: 'radio',
      name: groupName,
      value,
      onchange,
      checked: checked ? 'checked' : '',
    };

    return (
      <label class={`${ComponentType.RadioButton} ${checked} ${className}`}>
        <span class="radio-input">
          <input {...params} />
          <span class="radio-control" />
        </span>
        <span class="radio-label">{label || value}</span>
      </label>
    );
  },
};
