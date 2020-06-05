import 'sublayout.scss';

import m from 'mithril';
import Sidebar from 'views/components/sidebar';

const Sublayout: m.Component<{ class: string, rightSidebar? }> = {
  view: (vnode) => {
    const { rightSidebar } = vnode.attrs;

    return m('.Sublayout', {
      class: vnode.attrs.class
    }, [
      m('.left-sidebar', m(Sidebar)),
      m('.sublayout-content', vnode.children),
      rightSidebar && m('.right-sidebar', rightSidebar),
    ]);
  }
};

export default Sublayout;
