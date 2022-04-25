/* @jsx m */

import m from 'mithril';

export type PortalAttrs = {
  container?: HTMLElement;
};

export class CWPortal implements m.ClassComponent<PortalAttrs> {
  private rootElement: HTMLElement;
  private content: m.Component; // should this type be wider?

  public oncreate(vnode) {
    const rootElement = document.createElement('div');
    const container = vnode.attrs.container || document.body;
    container.appendChild(rootElement);
    this.rootElement = rootElement;

    this.content = { view: () => vnode.children };
    m.mount(this.rootElement, this.content);
  }

  onremove(vnode) {
    const container = vnode.attrs.container || document.body;

    if (container.contains(this.rootElement)) {
      m.mount(this.rootElement, null);
      container.removeChild(this.rootElement);
    }
  }

  public view() {
    return m.fragment({}, '');
  }
}
