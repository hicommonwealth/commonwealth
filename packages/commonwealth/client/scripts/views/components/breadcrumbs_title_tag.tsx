/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import { Tag } from 'construct-ui';

type BreadcrumbsTitleTagAttrs = {
  title: string;
};

export class BreadcrumbsTitleTag
  extends ClassComponent<BreadcrumbsTitleTagAttrs>
{
  view(vnode: m.Vnode<BreadcrumbsTitleTagAttrs>) {
    const { title } = vnode.attrs;

    return (
      <>
        {title}
        {m(Tag, {
          size: 'xs',
          label: 'Beta',
          style: 'position: relative; top: -2px; margin-left: 6px',
        })}
      </>
    );
  }
}
