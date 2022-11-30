/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_radio_group.scss';

import { CWRadioButton, RadioButton } from './cw_radio_button';
import { ComponentType } from './types';

type RadioGroupAttrs = {
  name: string;
  onchange: (e?: any) => void;
  options: Array<RadioButton>;
  toggledOption: string;
};
export class CWRadioGroup extends ClassComponent<RadioGroupAttrs> {
  view(vnode: m.Vnode<RadioGroupAttrs>) {
    const { options, onchange, name, toggledOption } = vnode.attrs;

    return (
      <div class={ComponentType.RadioGroup}>
        {options.map((o) => {
          return (
            <CWRadioButton
              value={o.value}
              label={o.label}
              checked={o.value === toggledOption}
              groupName={name}
              onchange={(e) => {
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
