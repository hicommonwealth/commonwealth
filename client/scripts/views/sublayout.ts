import 'sublayout.scss';

import m from 'mithril';
import Sidebar from 'views/components/sidebar';

const Sublayout: m.Component<{ class: string, rightSidebar?, leftSidebar? }> = {
  view: (vnode) => {
    const { rightSidebar, leftSidebar } = vnode.attrs;

    return m('.Sublayout', { class: vnode.attrs.class }, [
      m('.sublayout-main', [
        m('.left-sidebar', leftSidebar !== undefined ? leftSidebar : m(Sidebar)),
        m('.sublayout-content', vnode.children),
        m('.right-sidebar', rightSidebar),
      ]),
    ]);
  }
};

export default Sublayout;
