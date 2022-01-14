/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable max-len */
import 'components/component_kit/buttons.scss';
import m from 'mithril';
import { CWRadioButton } from './cw_radio_button';

import { CreateIcon, IconIntent, IconSize } from './icons';
import { ButtonType, LinkType, EngagementButtonSize } from './types';

export const appendTags = (base: string, attrs) => {
  const { intent, disabled, className, style, size } = attrs;
  let tag = base;
  if (disabled) tag += '.disabled';
  if (intent === ButtonType.Primary) tag += '.primary';
  else if (intent === ButtonType.Secondary) tag += '.secondary';
  if (style === LinkType.Button) tag += '.button';
  if (style === LinkType.Inline) tag += '.inline';
  if (size === EngagementButtonSize.Small) tag += '.sm';
  if (size === EngagementButtonSize.Large) tag += '.lg';
  if (className) tag += className;
  return tag;
};

export const FaceliftRadioGroup: m.Component<
  {
    values: string[];
    labels?: string[];
    defaultValue: string;
    name: string;
    onchange: Function;
    klass?: string;
    disabled?: boolean;
  },
  {
    toggledValue: string;
  }
> = {
  oninit: (vnode) => {
    if (!vnode.state.toggledValue) {
      vnode.state.toggledValue = vnode.attrs.defaultValue;
    }
  },
  view: (vnode) => {
    const { values, labels, onchange, name, klass, disabled } = vnode.attrs;
    const { toggledValue } = vnode.state;
    return m(
      `.RadioGroup.${klass || ''}`,
      values.map((val, idx) => {
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
      })
    );
  },
};

export const EngagementButton: m.Component<
  {
    size: EngagementButtonSize;
    label: string;
    onclick: Function;
    disabled?: boolean;
    className?: string;
  },
  {}
> = {
  view: (vnode) => {
    const { label, onclick, disabled } = vnode.attrs;
    return m(
      appendTags('Button.EngagementButton', vnode.attrs),
      {
        onclick,
      },
      [
        m(CreateIcon, {
          size: IconSize.MD,
          disabled,
          intent: IconIntent.Primary,
        }),
        m('span.label', label),
      ]
    );
  },
};
