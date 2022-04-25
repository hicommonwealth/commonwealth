/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_gradient_button.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { ButtonAttrs, ButtonStyleAttrs } from './cw_button';

export class CWGradientButton implements m.ClassComponent<ButtonAttrs> {
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
          ComponentType.GradientButton
        )}
        onclick={onclick}
        disabled={disabled}
      >
        <span>{label}</span>
      </button>
    );
  }
}
