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
  rootMount,
} from 'mithrilInterop';

export class CWPortal extends ClassComponent {
  private rootElement: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private content: any;

  oncreate(vnode: ResultNode) {
    const rootElement = document.createElement('div');
    const container = document.body;
    container.appendChild(rootElement);
    this.rootElement = rootElement;
    this.content = { view: () => vnode.children };
    rootMount(this.rootElement, this.content);
  }

  onremove() {
    const container = document.body;

    if (container.contains(this.rootElement)) {
      rootMount(this.rootElement, null);
      container.removeChild(this.rootElement);
    }
  }

  view() {
    return null;
  }
}
