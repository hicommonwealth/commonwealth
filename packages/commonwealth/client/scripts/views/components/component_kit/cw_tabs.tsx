/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_tabs.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';
import { CWText } from './cw_text';

type TabStyleAttrs = {
  disabled?: boolean;
  isSelected: boolean;
};

type TabAttrs = {
  label: string;
  onclick: () => void;
} & TabStyleAttrs;

export class CWTab extends ClassComponent<TabAttrs> {
  view(vnode: m.Vnode<TabAttrs>) {
    const { disabled, isSelected, label, onclick } = vnode.attrs;

    return (
      <div
        class={getClasses<TabStyleAttrs>(
          { isSelected, disabled },
          ComponentType.Tab
        )}
        onclick={onclick}
      >
        <CWText
          type="h4"
          className="tab-label-text"
          fontWeight={isSelected ? 'bold' : 'semiBold'}
        >
          {label}
        </CWText>
      </div>
    );
  }
}

export class CWTabBar extends ClassComponent {
  view(vnode: m.Vnode) {
    return <div class={ComponentType.TabBar}>{vnode.children}</div>;
  }
}
