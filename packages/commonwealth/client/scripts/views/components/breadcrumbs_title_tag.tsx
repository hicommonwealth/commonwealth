/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

type BreadcrumbsTitleTagAttrs = {
  title: string;
};

export class BreadcrumbsTitleTag extends ClassComponent<
  BreadcrumbsTitleTagAttrs
> {
  view(vnode: m.Vnode<BreadcrumbsTitleTagAttrs>) {
    const { title } = vnode.attrs;

    return (
      <>
        {title}
        {/* something will eventually go here once we get breadcrumbs working */}
      </>
    );
  }
}
