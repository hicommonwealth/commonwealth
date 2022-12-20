/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, redraw } from 'mithrilInterop';

import { Tag } from 'construct-ui';

type BreadcrumbsTitleTagAttrs = {
  title: string;
};

export class BreadcrumbsTitleTag extends ClassComponent<BreadcrumbsTitleTagAttrs> {
  view(vnode: ResultNode<BreadcrumbsTitleTagAttrs>) {
    const { title } = vnode.attrs;

    return (
      <>
        {title}
        {render(Tag, {
          size: 'xs',
          label: 'Beta',
          style: 'position: relative; top: -2px; margin-left: 6px',
        })}
      </>
    );
  }
}
