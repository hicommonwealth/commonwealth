/* @jsx m */

import m from 'mithril';

import { ComponentType, StyleProps } from './types';
import { getClasses } from './helpers';

export const CWGradientButton: m.Component<
  {
    styleProps: StyleProps;
    label: string;
    onclick: (e?: MouseEvent) => void;
  },
  Record<string, unknown>
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
