/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

type ListContainerAttrs = {
  bgColor: string;
  margin: string;
};

export class ListContainer extends ClassComponent<ListContainerAttrs> {
  view(vnode: m.Vnode<ListContainerAttrs>) {
    return (
      <ul
        class={`rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex
         lg:flex-col lg:h-full ${vnode.attrs.bgColor} ${vnode.attrs.margin}`}
      >
        {vnode.children}
      </ul>
    );
  }
}
