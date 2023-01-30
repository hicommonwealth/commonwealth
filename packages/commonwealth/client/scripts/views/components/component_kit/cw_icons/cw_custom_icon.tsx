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

import { customIconLookup } from './cw_icon_lookup';
import type { CustomIconAttrs } from './types';

export class CWCustomIcon extends ClassComponent<CustomIconAttrs> {
  view(vnode: ResultNode<CustomIconAttrs>) {
    const {
      componentType = ComponentType.CustomIcon,
      iconName,
      iconSize = 'medium',
      ...otherAttrs
    } = vnode.attrs;

    const CustomIcon = customIconLookup[iconName];

    return (
      <CustomIcon
        componentType={componentType}
        iconSize={iconSize}
        {...otherAttrs}
      />
    );
  }
}
