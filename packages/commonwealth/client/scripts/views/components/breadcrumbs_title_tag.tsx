import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

type BreadcrumbsTitleTagAttrs = {
  title: string;
};

export class BreadcrumbsTitleTag extends ClassComponent<BreadcrumbsTitleTagAttrs> {
  view(vnode: ResultNode<BreadcrumbsTitleTagAttrs>) {
    const { title } = vnode.attrs;

    return (
      <React.Fragment>
        {title}
        {/* something will eventually go here once we get breadcrumbs working */}
      </React.Fragment>
    );
  }
}
