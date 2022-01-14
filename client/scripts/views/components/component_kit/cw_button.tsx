/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_button.scss';

import { ButtonType, ComponentType, StyleProps } from './types';
import { getButtonClasses } from './helpers';

export type ButtonStyleProps = {
  buttonType: ButtonType;
} & StyleProps;

export type ButtonProps = {
  label: string;
  onclick: (e?: MouseEvent) => void;
} & ButtonStyleProps;

export const CWButton: m.Component<ButtonProps> = {
  view: (vnode) => {
    const { onclick, label, disabled, className, buttonType } = vnode.attrs;
    return (
      <button
        class={getButtonClasses(ComponentType.Button, {
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
