/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_collapsible.scss';

import { ComponentType } from './types';
import { CWIconButton } from './cw_icon_button';

type CollapsibleAttrs = {
  collapsibleContent: m.Vnode;
  headerContent: m.Vnode;
};

export class CWCollapsible implements m.ClassComponent<CollapsibleAttrs> {
  private isExpanded: boolean;

  view(vnode) {
    const { collapsibleContent, headerContent } = vnode.attrs;

    return (
      <div class={ComponentType.Collapsible}>
        <div class="header-and-content-container">
          <div class="collapsible-header">
            <div class="expand-icon-button">
              <CWIconButton
                iconName={this.isExpanded ? 'chevronDown' : 'chevronRight'}
                iconSize="large"
                onclick={() => {
                  this.isExpanded = !this.isExpanded;
                }}
              />
            </div>
            {headerContent}
          </div>
          <div class="content-container">
            {this.isExpanded && collapsibleContent}
          </div>
        </div>
      </div>
    );
  }
}
