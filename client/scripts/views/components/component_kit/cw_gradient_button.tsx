/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_gradient_button.scss';

import { ComponentType, State } from './types';
import { getClasses } from './helpers';
import { ButtonProps } from './cw_button';

export const CWGradientButton: m.Component<ButtonProps, State> = {
  view: (vnode) => {
    const { onclick, label, disabled, className, buttonType } = vnode.attrs;
    return (
      <button
        class={getClasses(ComponentType.GradientButton, {
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
