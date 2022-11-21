/* @jsx m */

import m from 'mithril';

import { Tag } from 'construct-ui';

export class BreadcrumbsTitleTag
  implements m.ClassComponent<{ title: string }>
{
  view(vnode) {
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
