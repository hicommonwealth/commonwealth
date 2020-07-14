import 'sublayout.scss';

import m from 'mithril';
import { Grid, Col } from 'construct-ui';
import Sidebar from 'views/components/sidebar';

const Sublayout: m.Component<{ class: string, rightSidebar?, leftSidebar? }> = {
  view: (vnode) => {
    const { rightSidebar, leftSidebar } = vnode.attrs;

    return m('.Sublayout', { class: vnode.attrs.class }, [
      m(Grid, { class: 'sublayout-main' }, [
        m(Col, { span: 3, class: 'left-sidebar' }, leftSidebar !== undefined ? leftSidebar : m(Sidebar)),
        m(Col, { span: 9, class: 'sublayout-content' }, vnode.children),
        // m('.right-sidebar', rightSidebar),
      ]),
    ]);
  }
};

export default Sublayout;
