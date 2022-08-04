/* @jsx m */

import m from 'mithril';

import { CWIcon } from './cw_icons/cw_icon';
import { IconAttrs } from './cw_icons/types';
import { ComponentType } from './types';

export class CWIconButton implements m.ClassComponent<IconAttrs> {
  view(vnode) {
    const {
      componentType = ComponentType.IconButton,
      disabled = false,
      iconButtonTheme = 'neutral',
      iconName,
      iconSize = 'medium',
      onclick,
      selected = false,
    } = vnode.attrs;

    return (
      <CWIcon
        className={iconButtonTheme}
        componentType={componentType}
        disabled={disabled}
        iconName={iconName}
        iconSize={iconSize}
        onclick={onclick}
        selected={selected}
      />
    );
  }
}
