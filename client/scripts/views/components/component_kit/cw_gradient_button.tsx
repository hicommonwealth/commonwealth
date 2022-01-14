/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_gradient_button.scss';

import { ComponentType } from './types';
import { getButtonClasses } from './helpers';
import { ButtonProps } from './cw_button';

export const CWGradientButton: m.Component<ButtonProps> = {
  view: (vnode) => {
    const { onclick, label, disabled, className, buttonType } = vnode.attrs;
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
