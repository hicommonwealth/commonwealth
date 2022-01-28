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
export class CWRadioGroup implements m.ClassComponent<RadioGroupAttrs> {
  toggledValue: string;

  oninit(vnode) {
    if (!this.toggledValue) {
      this.toggledValue = vnode.attrs.defaultValue;
    }
  }

  view(vnode) {
    const { values, labels, onchange, name, disabled } = vnode.attrs;
    return (
      <div class={ComponentType.RadioGroup}>
        {values.map((val, idx) => {
          return (
            <CWRadioButton
              value={val}
              label={labels[idx] || val}
              checked={val === this.toggledValue}
              groupName={name}
              onchange={(e) => {
                this.toggledValue = e?.target?.value;
                onchange(e);
              }}
              disabled={disabled}
            />
          );
        })}
      </div>
    );
  }
}
