/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_button.scss';

import { ButtonType, ComponentType, StyleAttrs } from './types';
import { getButtonClasses } from './helpers';

export type ButtonStyleAttrs = {
  buttonType: ButtonType;
} & StyleAttrs;

export type ButtonAttrs = {
  label: string;
  onclick: (e?: MouseEvent) => void;
} & ButtonStyleAttrs;

export const CWButton: m.Component<ButtonAttrs> = {
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
