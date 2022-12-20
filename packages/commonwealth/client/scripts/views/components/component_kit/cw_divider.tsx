/* @jsx m */
import m from 'mithril';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import 'components/component_kit/cw_divider.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

type DividerAttrs = {
  isVertical?: boolean;
};

export class CWDivider extends ClassComponent<DividerAttrs> {
  view(vnode: ResultNode<DividerAttrs>) {
    const { isVertical } = vnode.attrs;

    return (
      <div
        class={getClasses<DividerAttrs>({ isVertical }, ComponentType.Divider)}
      />
    );
  }
}
