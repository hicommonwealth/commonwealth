/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable max-len */
import 'components/component_kit/buttons.scss';
import m from 'mithril';

export enum ButtonIntent {
  Primary = 'primary',
  Secondary = 'secondary',
}

const appendTags = (attrs) => {
  const { intent, disabled, size } = attrs;
  let tag = `button.Button`;
  if (disabled) tag += '.disabled';
  if (intent === ButtonIntent.Primary) tag += '.primary';
  else if (intent === ButtonIntent.Secondary) tag += '.secondary';
  // if (size === IconSizes.SM) tag += '.sm';
  // if (size === IconSizes.MD) tag += '.md';
  // if (size === IconSizes.LG) tag += '.lg';
  return tag;
};

export const FaceliftButton: m.Component<
  {
    intent: ButtonIntent;
    label: string;
    onclick: Function;
    disabled?: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { onclick, label } = vnode.attrs;
    return m(appendTags(vnode.attrs), { onclick }, [m('span.label', label)]);
  },
};
