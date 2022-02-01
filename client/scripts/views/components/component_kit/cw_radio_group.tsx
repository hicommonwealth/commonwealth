/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_radio_group.scss';

import { CWRadioButton } from './cw_radio_button';
import { ComponentType } from './types';

type RadioGroupAttrs = {
  values: string[];
  labels?: string[];
  defaultValue: string;
  name: string;
  // TODO: Gabe 1/14/22 type onchange for real
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onchange: (e?: any) => void;
  disabled?: boolean;
};

type RadioGroupState = {
  toggledValue: string;
};

export const CWRadioGroup: m.Component<RadioGroupAttrs, RadioGroupState> = {
  oninit: (vnode) => {
    if (!vnode.state.toggledValue) {
      vnode.state.toggledValue = vnode.attrs.defaultValue;
    }
  },
  view: (vnode) => {
    const { values, labels, onchange, name, disabled } = vnode.attrs;
    const { toggledValue } = vnode.state;

    return (
      <div class={ComponentType.RadioGroup}>
        {values.map((val, idx) => {
          return m(CWRadioButton, {
            value: val,
            label: labels[idx] || val,
            checked: val === toggledValue,
            groupName: name,
            onchange: (e) => {
              vnode.state.toggledValue = e?.target?.value;
              onchange(e);
            },
            disabled,
          });
        })}
      </div>
    );
  },
};
