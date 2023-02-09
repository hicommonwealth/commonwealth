import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

type ListContainerAttrs = {
  bgColor: string;
  margin: string;
};

export class ListContainer extends ClassComponent<ListContainerAttrs> {
  view(vnode: ResultNode<ListContainerAttrs>) {
    return (
      <ul
        className={`rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex
         lg:flex-col lg:h-full ${vnode.attrs.bgColor} ${vnode.attrs.margin}`}
      >
        {vnode.children}
      </ul>
    );
  }
}
