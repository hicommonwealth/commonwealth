/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_collapsible.scss';
import m from 'mithril';
import { CWIconButton } from './cw_icon_button';

import { ComponentType } from './types';

type CollapsibleAttrs = {
  collapsibleContent: m.Vnode;
  headerContent: m.Vnode;
};

export class CWCollapsible extends ClassComponent<CollapsibleAttrs> {
  private isExpanded: boolean;

  view(vnode: m.Vnode<CollapsibleAttrs>) {
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
