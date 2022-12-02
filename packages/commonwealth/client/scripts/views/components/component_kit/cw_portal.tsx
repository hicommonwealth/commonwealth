/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

export class CWPortal extends ClassComponent {
  private rootElement: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private content: any;

  oncreate(vnode: m.Vnode) {
    const rootElement = document.createElement('div');
    const container = document.body;
    container.appendChild(rootElement);
    this.rootElement = rootElement;
    this.content = { view: () => vnode.children };
    m.mount(this.rootElement, this.content);
  }

  onremove() {
    const container = document.body;

    if (container.contains(this.rootElement)) {
      m.mount(this.rootElement, null);
      container.removeChild(this.rootElement);
    }
  }

  view() {
    return null;
  }
}
