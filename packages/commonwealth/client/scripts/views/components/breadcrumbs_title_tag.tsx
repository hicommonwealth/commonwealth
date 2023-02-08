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

type BreadcrumbsTitleTagAttrs = {
  title: string;
};

export class BreadcrumbsTitleTag extends ClassComponent<BreadcrumbsTitleTagAttrs> {
  view(vnode: ResultNode<BreadcrumbsTitleTagAttrs>) {
    const { title } = vnode.attrs;

    return (
      <>
        {title}
        {/* something will eventually go here once we get breadcrumbs working */}
      </>
    );
  }
}
