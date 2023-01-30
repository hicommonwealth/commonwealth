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

import 'components/component_kit/cw_collapsible.scss';
import { CWIconButton } from './cw_icon_button';

import { ComponentType } from './types';

type CollapsibleAttrs = {
  collapsibleContent: ResultNode;
  headerContent: ResultNode;
};

export class CWCollapsible extends ClassComponent<CollapsibleAttrs> {
  private isExpanded: boolean;

  view(vnode: ResultNode<CollapsibleAttrs>) {
    const { collapsibleContent, headerContent } = vnode.attrs;

    return (
      <div className={ComponentType.Collapsible}>
        <div className="header-and-content-container">
          <div className="collapsible-header">
            <div className="expand-icon-button">
              <CWIconButton
                iconName={this.isExpanded ? 'chevronDown' : 'chevronRight'}
                iconSize="large"
                onClick={() => {
                  this.isExpanded = !this.isExpanded;
                }}
              />
            </div>
            {headerContent}
          </div>
          <div className="content-container">
            {this.isExpanded && collapsibleContent}
          </div>
        </div>
      </div>
    );
  }
}
