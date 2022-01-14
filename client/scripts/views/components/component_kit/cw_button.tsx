/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_button.scss';

import { ButtonType, ComponentType, State, StyleProps } from './types';
import { getClasses } from './helpers';

type ButtonStyleProps = {
  buttonType: ButtonType;
} & StyleProps;

export type ButtonProps = {
  styleProps: ButtonStyleProps;
  label: string;
  onclick: (e?: MouseEvent) => void;
};

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
