import 'components/widgets/horizontal_tabs.scss';

import { default as _ } from 'lodash';
import { default as m } from 'mithril';

const HorizontalTabs = {
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
    return m('.HorizontalTabs', [
      m('.tab-bar', [
        names.map((name, index) => {
          return m('a.tab-entry', {
            class: (vnode.state.selectedIndex === index ? 'active' : '') +
              (vnode.children[index].disabled ? ' disabled' : ''),
            href: '#',
            onclick: ((index, e) => { e.preventDefault(); vnode.state.selectedIndex = index; }).bind(this, index),
          }, name);
        }),
      ]),
      m('.tab-content', vnode.children[vnode.state.selectedIndex].content),
    ]);
  }
};

export default HorizontalTabs;
