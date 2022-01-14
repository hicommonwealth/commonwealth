/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_button.scss';

import { ButtonType, ComponentType, State, StyleProps } from './types';
import { getClasses } from './helpers';

export type ButtonStyleProps = {
  buttonType: ButtonType;
} & StyleProps;

export type ButtonProps = {
  label: string;
  onclick: (e?: MouseEvent) => void;
} & ButtonStyleProps;

export const CWButton: m.Component<ButtonProps, State> = {
  view: (vnode) => {
    const { onclick, label, disabled, className, buttonType } = vnode.attrs;
    return (
      <button
        class={getClasses(ComponentType.Button, {
          disabled,
          className,
          buttonType,
        })}
        onclick={onclick}
        disabled={disabled}
      >
        <span>{label}</span>
      </button>
    );
  },
};
