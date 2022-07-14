/* @jsx m */

import m from 'mithril';
import _ from 'lodash';

import 'components/component_kit/cw_tabs.scss';

import { getClasses } from './helpers';

export class CWTabs implements m.ClassComponent {
  view(vnode) {
    if (!_.every(vnode.children, (c) => !!c.name && !!c.content)) {
      throw new Error('Must provide name and content for each tab');
    }

    if (vnode.children.length < 1) {
      throw new Error('Must provide at least one tab');
    }

    if (vnode.state.selectedIndex === undefined) {
      // tslint:disable-next-line:no-string-literal
      const defaultSelectedIndex = _.findIndex(
        vnode.children,
        (c) => c['selected']
      );

      vnode.state.selectedIndex =
        defaultSelectedIndex === -1 ? 0 : defaultSelectedIndex;
    }

    const names = vnode.children.map((t) => t.name);

    return (
      <div class="Tabs">
        <div class="tab-bar">
          {names.map((name, index) => {
            return (
              <div
                class={getClasses<{ isActive: boolean }>(
                  { isActive: vnode.state.selectedIndex === index },
                  'tab-entry'
                )}
                onclick={((i) => {
                  vnode.state.selectedIndex = i;

                  if (vnode.children[index].onclick) {
                    vnode.children[index].onclick();
                  }
                }).bind(this, index)}
              >
                {name}
              </div>
            );
          })}
        </div>
        <div class="tab-content">
          {vnode.children[vnode.state.selectedIndex].content}
        </div>
      </div>
    );
  }
}
