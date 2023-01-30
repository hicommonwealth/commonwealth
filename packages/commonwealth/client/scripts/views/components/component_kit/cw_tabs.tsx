/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_tabs.scss';
import { CWText } from './cw_text';

import { getClasses } from './helpers';
import { ComponentType } from './types';

type TabStyleAttrs = {
  disabled?: boolean;
  isSelected: boolean;
};

type TabAttrs = {
  label: string;
  onClick: () => void;
} & TabStyleAttrs;

export class CWTab extends ClassComponent<TabAttrs> {
  view(vnode: ResultNode<TabAttrs>) {
    const { disabled, isSelected, label, onClick } = vnode.attrs;

    return (
      <div
        className={getClasses<TabStyleAttrs>(
          { isSelected, disabled },
          ComponentType.Tab
        )}
        onClick={onClick}
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
  view(vnode: ResultNode) {
    return <div className={ComponentType.TabBar}>{vnode.children}</div>;
  }
}
