/* @jsx m */

import m, { Vnode } from 'mithril';
import 'components/component_kit/cw_button.scss';

import { ButtonType, ComponentType, StyleAttrs } from './types';
import { getButtonClasses } from './helpers';

export type ButtonStyleAttrs = {
  buttonType?: ButtonType;
} & StyleAttrs;

export type ButtonAttrs = {
  label: string | Vnode<any>;
  onclick: (e?: MouseEvent) => void;
} & ButtonStyleAttrs;

export const CWButton: m.Component<ButtonAttrs> = {
  view: (vnode) => {
    const {
      buttonType = 'primary',
      className,
      disabled = false,
      label,
      onclick,
    } = vnode.attrs;
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
