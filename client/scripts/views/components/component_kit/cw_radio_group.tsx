/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_radio_group.scss';

import { CWRadioButton } from './cw_radio_button';
import { ComponentType } from './types';

type RadioGroupOption = { label: string; value: string };

type RadioGroupAttrs = {
  options: Array<RadioGroupOption>;
  defaultValue: RadioGroupOption;
  name: string;
  onchange: (e?: any) => void;
};
export class CWRadioGroup implements m.ClassComponent<RadioGroupAttrs> {
  toggledValue: string;

  oninit(vnode) {
    if (!this.toggledValue) {
      this.toggledValue = vnode.attrs.defaultValue.value;
    }
  }

  view(vnode) {
    const { options, onchange, name } = vnode.attrs;
    return (
      <div class={ComponentType.RadioGroup}>
        {options.map((o) => {
          return (
            <CWRadioButton
              value={o.value}
              label={o.label}
              checked={o.value === this.toggledValue}
              groupName={name}
              onchange={(e) => {
                this.toggledValue = e?.target?.value;
                onchange(e);
              }}
              disabled={o.disabled}
            />
          );
        })}
      </div>
    );
  }
}
