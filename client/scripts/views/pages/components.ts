import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import ComponentKit from 'views/components/component_kit';

const ComponentsPage: m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM) => {
    return m(
      Sublayout,
      {
        title: 'Commonwealth UI Component Kit',
        class: 'ComponentsPage',
        alwaysShowTitle: true,
      },
      [m(ComponentKit)]
    );
  },
};

export default ComponentsPage;
