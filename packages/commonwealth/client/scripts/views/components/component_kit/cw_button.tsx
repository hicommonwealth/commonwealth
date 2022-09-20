/* @jsx m */

import m, { Vnode } from 'mithril';

import 'components/component_kit/cw_button.scss';

import { ComponentType, StyleAttrs } from './types';
import { getClasses } from './helpers';
import { CWText } from './cw_text';
import { IconName } from './cw_icons/cw_icon_lookup';
import { CWIcon } from './cw_icons/cw_icon';

export type ButtonType =
  | 'primary-red'
  | 'primary-blue'
  | 'primary-black'
  | 'secondary-red'
  | 'secondary-blue'
  | 'secondary-black'
  | 'tertiary-blue'
  | 'tertiary-black'
  | 'lg-primary-red'
  | 'lg-primary-blue'
  | 'lg-secondary-red'
  | 'lg-secondary-blue'
  | 'lg-tertiary-red'
  | 'lg-tertiary-blue'
  | 'primary-blue-dark'
  | 'secondary-blue-dark'
  | 'mini-black'
  | 'mini-white';

export type ButtonStyleAttrs = {
  buttonType?: ButtonType;
} & StyleAttrs;

export type ButtonAttrs = {
  iconLeft?: IconName;
  iconRight?: IconName;
  label: string | Vnode<any>;
  onclick: (e?: MouseEvent) => void;
} & ButtonStyleAttrs;

const getTextType = (buttonType: ButtonType) => {
  if (buttonType.slice(0, 2) === 'lg') {
    return 'buttonLg';
  } else if (buttonType.slice(0, 4) === 'mini') {
    return 'buttonMini';
  } else {
    return 'buttonSm';
  }
};

export class CWButton implements m.ClassComponent<ButtonAttrs> {
  view(vnode) {
    const {
      buttonType = 'primary-blue',
      className,
      disabled = false,
      iconLeft,
      iconRight,
      label,
      onclick,
    } = vnode.attrs;
    return (
      <button
        class={getClasses<ButtonStyleAttrs>(
          {
            disabled,
            buttonType,
            className,
          },
          ComponentType.Button
        )}
        onclick={onclick}
        disabled={disabled}
      >
        {!!iconLeft && (
          <CWIcon
            iconName={iconLeft}
            iconSize="small"
            className="button-icon"
          />
        )}
        <CWText type={getTextType(buttonType)} className="button-text" noWrap>
          {label}
        </CWText>
        {!!iconRight && (
          <CWIcon
            iconName={iconRight}
            iconSize="small"
            className="button-icon"
          />
        )}
      </button>
    );
  }
}
