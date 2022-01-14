/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_radio_button.scss';

import { State } from './types';
import { appendTags } from './buttons';

export const RadioButton: m.Component<
  {
    value: string;
    label?: string;
    toggled: boolean;
    groupName: string;
    // TODO: Gabe 1/14/22 type onchange for real
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onchange: (e?: any) => void;
    className?: string;
    disabled?: boolean;
  },
  State
> = {
  view: (vnode) => {
    const { toggled, value, label, groupName, onchange } = vnode.attrs;

    const params = {
      type: 'radio',
      name: groupName,
      value,
      onchange,
    };

    if (toggled) params['checked'] = 'checked';

    return m(appendTags('label.RadioButton', vnode.attrs), [
      m('span.radio-input', [m('input', params), m('span.radio-control')]),
      m('span.radio-label', label || value),
    ]);
  },
};
