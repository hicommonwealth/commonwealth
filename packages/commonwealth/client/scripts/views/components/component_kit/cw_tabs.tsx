/* @jsx m */

import m from 'mithril';

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

export class CWTab implements m.ClassComponent<TabAttrs> {
  view(vnode) {
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

export class CWTabBar implements m.ClassComponent {
  view(vnode) {
    return <div class={ComponentType.TabBar}>{vnode.children}</div>;
  }
}
