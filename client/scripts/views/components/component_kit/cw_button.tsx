/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_button.scss';

import { ComponentType, State, ButtonProps } from './types';
import { getClasses } from './helpers';

export const CWButton: m.Component<ButtonProps, State> = {
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
