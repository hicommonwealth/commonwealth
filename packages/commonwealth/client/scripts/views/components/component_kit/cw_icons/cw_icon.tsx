/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_icon.scss';
import { ComponentType } from '../types';

import { iconLookup } from './cw_icon_lookup';
import type { IconComponentAttrs } from './types';

export class CWIcon extends ClassComponent<IconComponentAttrs> {
  view(vnode: ResultNode<IconComponentAttrs>) {
    const {
      className,
      componentType = ComponentType.Icon,
      disabled = false,
      iconName,
      iconSize = 'medium',
      onClick,
      selected,
      ...otherAttrs
    } = vnode.attrs;

    const Icon = iconLookup[iconName];

    return (
      <Icon
        className={className}
        componentType={componentType}
        disabled={disabled}
        iconSize={iconSize}
        onClick={onClick}
        selected={selected}
        {...otherAttrs}
      />
    );
  }
}
