/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_gradient_button.scss';

import { ComponentType } from './types';
import { getButtonClasses } from './helpers';
import { ButtonAttrs } from './cw_button';

export const CWGradientButton: m.Component<ButtonAttrs> = {
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
        class={getButtonClasses(ComponentType.GradientButton, {
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
