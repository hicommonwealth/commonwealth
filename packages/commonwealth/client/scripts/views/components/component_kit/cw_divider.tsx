/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_divider.scss';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type DividerAttrs = {
  isVertical?: boolean;
  className?: string;
};

export class CWDivider extends ClassComponent<DividerAttrs> {
  view(vnode: ResultNode<DividerAttrs>) {
    const { isVertical, className } = vnode.attrs;

    return (
      <div
        className={getClasses<DividerAttrs>(
          { isVertical, className },
          ComponentType.Divider
        )}
      />
    );
  }
}
