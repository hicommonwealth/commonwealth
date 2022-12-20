/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import { CWIcon } from './cw_icons/cw_icon';
import { IconComponentAttrs } from './cw_icons/types';
import { ComponentType } from './types';

export class CWIconButton extends ClassComponent<IconComponentAttrs> {
  view(vnode: ResultNode<IconComponentAttrs>) {
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
