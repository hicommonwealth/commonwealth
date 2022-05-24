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
  | 'secondary-red'
  | 'secondary-blue'
  | 'secondary-black'
  | 'tertiary-blue'
  | 'tertiary-black';

export type ButtonStyleAttrs = {
  buttonType?: ButtonType;
} & StyleAttrs;

export type ButtonAttrs = {
  iconName?: IconName;
  label: string | Vnode<any>;
  onclick: (e?: MouseEvent) => void;
} & ButtonStyleAttrs;

export class CWButton implements m.ClassComponent<ButtonAttrs> {
  view(vnode) {
    const {
      buttonType = 'primary-red',
      className,
      disabled = false,
      iconName,
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
        {!!iconName && (
          <CWIcon
            iconName={iconName}
            iconSize="small"
            className="button-icon"
          />
        )}
        <CWText type="buttonSm" className="button-text" noWrap>
          {label}
        </CWText>
      </button>
    );
  }
}
