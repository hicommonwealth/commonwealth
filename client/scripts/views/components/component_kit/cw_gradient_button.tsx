/* @jsx m */

import m from 'mithril';

import { ComponentType, ButtonStyleProps, State } from './types';
import { getClasses } from './helpers';

export const CWGradientButton: m.Component<
  {
    styleProps: ButtonStyleProps;
    label: string;
    onclick: (e?: MouseEvent) => void;
  },
  State
> = {
  view: (vnode) => {
    const { onclick, label, styleProps } = vnode.attrs;
    return (
      <button
        class={getClasses(ComponentType.GradientButton, styleProps)}
        onclick={onclick}
        disabled={styleProps.disabled}
      >
        <span>{label}</span>
      </button>
    );
  },
};
