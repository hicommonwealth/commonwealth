/* @jsx m */
import m from 'mithril';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import 'components/component_kit/cw_radio_group.scss';

import { CWRadioButton, RadioButtonType } from './cw_radio_button';
import { ComponentType } from './types';

type RadioGroupAttrs = {
  name: string;
  onchange: (e?: any) => void;
  options: Array<RadioButtonType>;
  toggledOption: string;
};
export class CWRadioGroup extends ClassComponent<RadioGroupAttrs> {
  view(vnode: ResultNode<RadioGroupAttrs>) {
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
              onchange={onchange}
              disabled={o.disabled}
            />
          );
        })}
      </div>
    );
  }
}
