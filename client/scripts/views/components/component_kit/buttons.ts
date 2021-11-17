/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable max-len */
import 'components/component_kit/buttons.scss';
import m from 'mithril';
import { CreateIcon, ExternalLinkIcon, IconIntent, IconSize } from './icons';

export enum ButtonIntent {
  Primary = 'primary',
  Secondary = 'secondary',
}

export enum Justify {
  Right = 'right',
  Center = 'center',
  Left = 'left',
}

export enum LinkStyle {
  Button = 'button',
  Inline = 'inline',
}

export enum ButtonSize {
  SM = 'sm',
  LG = 'lg',
}

const appendTags = (base: string, attrs) => {
  const { intent, disabled, className, style, size } = attrs;
  let tag = base;
  if (disabled) tag += '.disabled';
  if (intent === ButtonIntent.Primary) tag += '.primary';
  else if (intent === ButtonIntent.Secondary) tag += '.secondary';
  if (style === LinkStyle.Button) tag += '.button';
  if (style === LinkStyle.Inline) tag += '.inline';
  if (size === ButtonSize.SM) tag += '.sm';
  if (size === ButtonSize.LG) tag += '.lg';
  if (className) tag += className;
  return tag;
};

export const FaceliftButton: m.Component<
  {
    intent: ButtonIntent;
    label: string;
    onclick: Function;
    disabled?: boolean;
    className?: string;
  },
  {}
> = {
  view: (vnode) => {
    const { onclick, label } = vnode.attrs;
    return m(appendTags('button.Button', vnode.attrs), { onclick }, [
      m('span.label', label),
    ]);
  },
};

export const FaceliftButtonGroup: m.Component<
  {
    primaryLabel: string;
    secondaryLabel: string;
    primaryOnClick: Function;
    secondaryOnClick: Function;
    primaryDisabled?: boolean;
    secondaryDisabled?: boolean;
    justify?: Justify;
    className?: string;
  },
  {}
> = {
  view: (vnode) => {
    const {
      primaryLabel,
      secondaryLabel,
      primaryOnClick,
      secondaryOnClick,
      primaryDisabled,
      secondaryDisabled,
      justify,
    } = vnode.attrs;
    return m(
      appendTags('.ButtonGroup', vnode.attrs),
      {
        style: `justify-content: ${justify}`,
      },
      [
        m(FaceliftButton, {
          intent: ButtonIntent.Secondary,
          label: secondaryLabel,
          disabled: secondaryDisabled,
          onclick: secondaryOnClick,
        }),
        m(FaceliftButton, {
          intent: ButtonIntent.Primary,
          label: primaryLabel,
          disabled: primaryDisabled,
          onclick: primaryOnClick,
        }),
      ]
    );
  },
};

// TODO: Synchronize/reconcile against
// Mithril internal/external link helpers
export const ExternalLinkElement: m.Component<
  {
    label: string;
    target: string;
    style: LinkStyle;
  },
  {}
> = {
  view: (vnode) => {
    const { label, target } = vnode.attrs;
    return m(
      appendTags('.ExternalLinkElement', vnode.attrs),
      {
        href: target,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      [m('.link-text', label), m(ExternalLinkIcon)]
    );
  },
};

export const RadioButton: m.Component<
  {
    value: string;
    label?: string;
    toggled: boolean;
    groupName: string;
    onchange: Function;
    className?: string;
    disabled?: boolean;
  },
  {}
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
    const {
      values,
      labels,
      onchange,
      name,
      klass,
      disabled,
    } = vnode.attrs;
    const { toggledValue } = vnode.state;
    return m(
      `.RadioGroup.${klass || ''}`,
      values.map((val, idx) => {
        return m(RadioButton, {
          value: val,
          label: labels[idx] || val,
          toggled: val === toggledValue,
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
    size: ButtonSize;
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
