/* @jsx m */

import m from 'mithril';
import 'components/component_kit/buttons.scss';

import { ComponentType, StyleProps } from './types';
import { getClasses } from './helpers';

export const CWButton: m.Component<
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
        class={getClasses(ComponentType.Button, styleProps)}
        onclick={onclick}
        disabled={styleProps.disabled}
      >
        <span>{label}</span>
      </button>
    );
  },
};
