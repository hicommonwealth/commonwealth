/* @jsx m */

import m, { Vnode } from 'mithril';

import 'components/component_kit/cw_button.scss';

import { ButtonType, ComponentType, StyleAttrs } from './types';
import { getClasses } from './helpers';

export type ButtonStyleAttrs = {
  buttonType?: ButtonType;
} & StyleAttrs;

export type ButtonAttrs = {
  label: string | Vnode<any>;
  onclick: (e?: MouseEvent) => void;
} & ButtonStyleAttrs;

export class CWButton implements m.ClassComponent<ButtonAttrs> {
  view(vnode) {
    const {
      buttonType = 'primary',
      className,
      disabled = false,
      label,
      onclick,
    } = vnode.attrs;
    return (
      <button
        class={getClasses<ButtonStyleAttrs>(
          {
            disabled,
            className,
            buttonType,
          },
          ComponentType.Button
        )}
        onclick={onclick}
        disabled={disabled}
      >
        <span>{label}</span>
      </button>
    );
  }
}
