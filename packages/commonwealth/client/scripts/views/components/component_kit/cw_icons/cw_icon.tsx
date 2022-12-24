/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_icon.scss';

import { iconLookup } from './cw_icon_lookup';
import { IconComponentAttrs } from './types';
import { ComponentType } from '../types';

export class CWIcon extends ClassComponent<IconComponentAttrs> {
  view(vnode: ResultNode<IconComponentAttrs>) {
    const {
      className,
      componentType = ComponentType.Icon,
      disabled = false,
      iconName,
      iconSize = 'medium',
      onclick,
      selected,
      ...otherAttrs
    } = vnode.attrs;

    const Icon = iconLookup[iconName];

    return (
      <Icon
        class={className}
        componentType={componentType}
        disabled={disabled}
        iconSize={iconSize}
        onClick={onclick}
        selected={selected}
        {...otherAttrs}
      />
    );
  }
}
