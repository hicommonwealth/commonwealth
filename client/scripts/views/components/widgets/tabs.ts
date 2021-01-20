import 'components/widgets/tabs.scss';

import _ from 'lodash';
import m from 'mithril';

const Tabs = {
  view: (vnode) => {
    if (!_.every(vnode.children, (c) => !!c.name && !!c.content)) {
      throw new Error('Must provide name and content for each tab');
    }
    if (vnode.children.length < 1) {
      throw new Error('Must provide at least one tab');
    }
    if (vnode.state.selectedIndex === undefined) {
      // tslint:disable-next-line:no-string-literal
      const defaultSelectedIndex = _.findIndex(vnode.children, (c) => c['selected']);
      vnode.state.selectedIndex = defaultSelectedIndex === -1 ? 0 : defaultSelectedIndex;
    }
    const names = vnode.children.map((t) => t.name);
    return m('.Tabs', [
      m('.tab-bar', [
        names.map((name, index) => {
          return m('a.tab-entry', {
            class: (vnode.state.selectedIndex === index ? 'active' : '')
              + (vnode.children[index].disabled ? ' disabled' : ''),
            href: '#',
            onclick: ((i, e) => {
              e.preventDefault();
              vnode.state.selectedIndex = i;
              if (typeof vnode.children[vnode.state.selectedIndex].callback === 'function') {
                vnode.children[vnode.state.selectedIndex].callback(i);
              }
            }).bind(this, index)
          }, name);
        }),
        m('.clear'),
      ]),
      m('.tab-content', vnode.children[vnode.state.selectedIndex].content),
      m('.clear'),
    ]);
  }
};

export default Tabs;
